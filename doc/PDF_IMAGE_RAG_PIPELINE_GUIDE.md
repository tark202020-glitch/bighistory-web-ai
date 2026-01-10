# PDF Image RAG Pipeline Development Guide

본 문서는 PDF 문서에서 이미지를 추출하고, 이를 AI 검색(RAG)과 연동하여 최종 사용자에게 보여주기까지의 **전체 기술 프로세스**와 **시행착오(Troubleshooting)**를 정리한 문서입니다. 향후 유사 프로젝트 진행 시 가이드라인으로 활용할 수 있습니다.

---

## 1. 아키텍처 개요 (Architecture Overview)

전체 파이프라인은 크게 **데이터 전처리(ETL)**, **검색(Retrieval)**, **생성 및 서빙(Generation & Serving)**의 3단계로 구성됩니다.

```mermaid
graph LR
    A[PDF Documents] -->|OpenCV/PyMuPDF| B(Image Extraction)
    B -->|Naming Rules| C[GCS Bucket (Images)]
    A -->|Text Extraction| D[Vertex AI Search (Chunks)]
    
    E[User Query] -->|Next.js API| F{Vertex AI Search}
    F -->|Metadata: Page/URI| G[Backend Logic]
    G -->|Match BookId & Page| C
    C -->|Signed URL| H[Image Proxy (/api/proxy-image)]
    H -->|Proxy URL| I[LLM Context]
    I -->|Markdown| J[Chat UI]
```

---

## 2. 상세 구현 프로세스 (Implementation Details)

### Phase 1: 이미지 추출 및 전처리 (Preprocessing)
- **도구**: Python (`PyMuPDF`, `fitz`) 또는 Node.js 라이브러리.
- **핵심 전략**: 
  - PDF의 각 페이지를 순회하며 이미지를 추출합니다.
  - **파일명 규칙(Naming Convention)이 생명입니다.**
  - **포맷**: `{BookID}-Main_p{PageNumber}_{Index}.{ext}`
    - 예: `15-Main_p023_01.jpeg` (15번 책, 본문, 23페이지, 첫 번째 이미지)
  - 이 규칙이 지켜져야 나중에 검색된 텍스트 청크(Chunk)의 메타데이터(페이지 번호)와 이미지를 매칭할 수 있습니다.

### Phase 2: 검색 엔진 설정 (Vertex AI Search)
- **Chunk Mode 사용**: 
  - 단순 문서 검색이 아닌, **청크(Chunk)** 단위 검색을 활성화해야 정확한 문단과 해당 페이지 위치를 찾을 수 있습니다.
  - **주의**: `extractiveContentSpec` 옵션은 청크 모드(`searchResultMode: 'CHUNKS'`)와 함께 사용할 수 없습니다. (충돌 발생)

### Phase 3: 백엔드 이미지 매칭 (Backend Logic)
- **검색 결과**: Vertex AI는 텍스트 청크와 함께 `documentMetadata` (URI, Title, Page info)를 반환합니다.
- **매칭 로직**:
  1. 검색된 청크의 `Page Number`와 `Source URI(Book ID)`를 파싱합니다.
  2. Google Cloud Storage(GCS) 버킷에서 해당 `BookID` + `PageNumber` 패턴(`*_p023_*.jpeg`)과 일치하는 이미지 파일 목록을 조회합니다.
  3. 일치하는 이미지가 있다면 **Signed URL** (시간 제한이 있는 접근 링크)을 생성합니다.

### Phase 4: 프록시 및 프롬프트 엔지니어링 (Rendering)
- **Proxy Strategy (중요)**:
  - GCS Signed URL은 매우 길고(`...&Signature=AbCd...`) 특수문자가 많아, LLM이 이를 처리하다가 링크를 깨먹거나 토큰 제한에 걸릴 위험이 큽니다.
  - **해결책**: `/api/proxy-image?bookId=...` 형태의 짧은 내부 URL을 LLM에게 전달하고, 백엔드에서 실제 리다이렉트를 처리합니다.
- **Prompt Engineering**:
  - LLM에게 이미지를 "코드 블록"이나 "인용문" 안에 넣지 말고, **반드시 독립된 문단**으로 출력하도록 강제합니다.

---

## 3. 개발 중 발생한 에러 기록 (Troubleshooting Log)

이 프로젝트를 진행하며 겪었던 주요 에러와 해결책입니다. **이 실수를 반복하지 마십시오.**

### 🚨 1. Vertex AI `INVALID_ARGUMENT`
- **증상**: 검색 API 호출 시 400 에러 발생.
- **원인**: `searchResultMode: 'CHUNKS'`와 `extractiveContentSpec` (요약/추출 설정)을 동시에 요청함. 두 옵션은 상호 배타적임.
- **해결**: 청크 모드 사용 시 `extractiveContentSpec` 제거.

### 🚨 2. GCS Credential "Formatting" Issue
- **증상**: 로컬에선 되는데 배포(Vercel) 환경에서 `SyntaxError` 또는 `ERR_OSSL_UNSUPPORTED` 발생.
- **원인**: `.env` 파일의 `private_key` 값에 포함된 개행 문자(`\n`)가 시스템에 따라 `\\n` (문자열)으로 인식되거나, 줄바꿈이 사라져서 PEM 키 형식이 깨짐.
- **해결**:
  - `JSON.parse` 실패 시 `replace(/\\n/g, '\n')` 로직 추가.
  - PEM 키가 한 줄로 뭉쳐있을 경우, 64자마다 줄바꿈을 강제로 삽입하여 `-----BEGIN...` 포맷을 **재조립(Reconstruction)**하는 방어 코드 구현.

### 🚨 3. Broken Image (엑스박스)
- **증상**: 이미지 링크가 생성되었으나 클릭하면 403 Forbidden 또는 404 발생.
- **원인 A**: LLM이 긴 Signed URL을 생성하다가 중간에 잘라먹거나 특수문자(`&`, `%`)를 변형함.
- **원인 B**: 마크다운 렌더러가 URL 뒤의 괄호`)`를 잘못 인식함.
- **해결**: **Image Proxy** 도입. LLM에게는 단순한 URL(`proxy-image?id=1`)만 주고 복잡한 처리는 서버가 담당.

### 🚨 4. 이미지가 코드로 보임 (Markdown Rendering)
- **증상**: 이미지가 그림으로 안 나오고 `![img](...)` 텍스트 그대로 노출되거나 코드 블록 안에 갇힘.
- **원인**: LLM이 이미지를 `<details>` 태그 안이나 인용문 안에 넣어서 마크다운 파싱이 씹힘.
- **해결**: 프롬프트에 **"이미지는 반드시 독립된 문단(Separate Paragraph)으로 배치하라"**는 강력한 제약사항 추가.

---

## 4. 향후 프로젝트시 주의사항 (Checklist)

1. **파일명 규칙 준수**: 이미지 파일명에 메타데이터(ID, 페이지)가 무조건 포함되어야 합니다. 이것이 없으면 자동화가 불가능합니다.
2. **환경 변수 관리**: `private_key` 같은 멀티라인 값은 배포 환경(Vercel, Docker 등)에서 개행 문자가 깨지는 경우가 빈번하므로, **반드시 키 재조립 로직(Sanitization)**을 코드 레벨에서 포함하십시오.
3. **URL 안전성 확보**: LLM에게 직접 외부 URL(S3, GCS Signed URL)을 주지 마십시오. **프록시 패턴**을 사용하여 LLM 입출력을 단순화해야 합니다.
4. **프롬프트 포맷팅 강제**: "알아서 예쁘게"라고 하면 안 됩니다. "빈 줄을 넣고, 독립된 문단으로 작성하라"고 구체적으로 지시해야 UI 렌더링 사고를 막습니다.
