# 목차(TOC) PDF 해석 및 페이지 매핑 로직

## 1. 개요
`01_Content.pdf`와 같은 목차 파일은 텍스트가 아닌 **시각적 레이아웃(디자인)**이 포함된 형태입니다. 기존 OCR로는 정확한 구조 파악이 어렵기 때문에, **Vertex AI Gemini 1.5 Pro**의 멀티모달 기능을 사용하여 시각 정보를 있는 그대로 해석합니다.

## 2. 처리 프로세스 (Logic Flow)

데이터 처리는 크게 **추출(Extraction)**과 **계산(Calculation)** 두 단계로 나뉩니다.

### 1단계: 멀티모달 데이터 추출 (Google Cloud Vertex AI)
Gemini 1.5 Pro 모델에게 PDF 파일을 이미지 형태로 제공하고, 아래와 같은 프롬프트를 통해 정형 데이터(JSON)로 변환합니다.

*   **프롬프트 전략**:
    > "이 문서는 책의 목차입니다. 각 항목의 '제목(title)'과 '시작 페이지 번호(page)'를 추출하여 JSON 리스트로 출력해 주세요. 서문, 추천사, 타임라인 등 모든 항목을 포함하세요."

*   **예상 출력 (JSON)**:
    ```json
    [
      {"title": "서문", "page": 5},
      {"title": "추천사", "page": 11},
      {"title": "타임라인", "page": 14},
      {"title": "1_밤하늘은 왜 어두울까?-올베르스가 품은 의문", "page": 24},
      ...
    ]
    ```

### 2단계: 페이지 범위 계산 (Python Logic)
추출된 데이터는 "시작 페이지"만 있고 "끝 페이지"가 없습니다. 따라서 **다음 항목의 시작 페이지 바로 전**까지를 해당 항목의 범위로 계산합니다.

*   **Logic**:
    *   `item[i].end_page = item[i+1].start_page - 1`
    *   마지막 항목의 끝 페이지는 문서의 전체 페이지 수(또는 임의의 끝)로 설정합니다.

### 3단계: 최종 포맷팅
사용자가 요청한 텍스트 포맷(`Start~End : Title`)으로 변환합니다.

## 3. 구현 코드 (Python)

`scripts/parse_pdf_toc.py` 파일에 실제 구현 코드를 제공합니다. 이 코드는 GCP Vertex AI 환경에서 즉시 실행 가능하도록 작성되었습니다.

### 주요 라이브러리
*   `vertexai`: Google Cloud AI 모델 연동
*   `json`: 데이터 파싱

---

## 4. 데이터베이스 연동 예시 (Supabase)

## 5. Google Cloud Console에서 직접 테스트하기 (No-Code)
코드를 작성하지 않고 웹 브라우저에서 바로 테스트해 볼 수 있습니다.

1.  **접속**: [Google Cloud Vertex AI Studio](https://console.cloud.google.com/vertex-ai/generative/multimodal/create) 로 이동합니다.
2.  **모델 선택**: 상단 모델 선택창에서 **Gemini 1.5 Pro**를 선택합니다.
3.  **파일 업로드**: 'Insert Media' > 'Upload' 버튼을 눌러 `01_Content.pdf` 파일을 업로드합니다.
4.  **프롬프트 입력**: 아래 프롬프트를 복사해서 입력창에 붙여넣습니다.
    ```text
    이 문서는 책의 목차입니다. 각 항목의 '제목(title)'과 '시작 페이지 번호(page)'를 추출하여 JSON 리스트로 출력해 주세요. 서문, 추천사, 타임라인 등 모든 항목을 포함하세요.
    ```
5.  **실행**: 파란색 전송(Submit) 버튼을 누르면 우측에 `JSON` 결과가 출력됩니다.

