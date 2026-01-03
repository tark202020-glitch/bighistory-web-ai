# Google Cloud RAG 시스템 구축 및 연동 가이드

본 가이드는 현재 BigHistory AI 플랫폼에 구축된 **Vertex AI Search & Conversation (Discovery Engine)** 기반의 RAG 시스템을 다른 프로젝트에 복제하여 구축하는 방법을 상세히 설명합니다.
원천 데이터(PDF 등)만 교체하면 동일한 고성능 AI 답변 시스템을 즉시 사용할 수 있습니다.

---

## 1. 사전 준비 (Prerequisites)
- Google Cloud Platform (GCP) 계정 및 결제 등록 완료
- 새로운 GCP 프로젝트 생성 (예: `my-new-rag-project`)

## 2. Google Cloud 설정 단계 (Console 작업)

### 2.1 API 활성화
1.  GCP Console 사이드바에서 **"API 및 서비스" > "라이브러리"** 로 이동합니다.
2.  다음 API들을 검색하여 **사용(Enable)** 설정합니다.
    *   **Vertex AI API**
    *   **Discovery Engine API** (또는 'Agent Builder')

### 2.2 Agent Builder (Data Store) 생성 [핵심]
여기가 가장 중요합니다. AI가 참조할 지식 베이스를 만드는 과정입니다.

1.  GCP 상단 검색창에 **"Agent Builder"** 검색 및 접속.
2.  **"앱 새로 만들기 (Create App)"** 클릭.
3.  **"검색(Search)"** 유형 선택 (Chat 기능도 포함됨).
4.  **기능 구성**:
    *   **Enterprise 기능**: 켜짐 (Generative AI 기능을 위해 필수)
    *   **고급 LLM 기능**: 켜짐
5.  **데이터 저장소(Data Store) 만들기**:
    *   "새 데이터 저장소 만들기" 클릭.
    *   출처 선택: **Cloud Storage** (추천) 또는 **파일 업로드**.
        *   *팁: PDF 파일들을 관리를 위해 먼저 Google Cloud Storage 버킷을 만들고 거기에 업로드하는 것이 좋습니다.*
    *   데이터 유형: **비정형 문서(Unstructured documents)** (PDF, HTML 등) 선택.
6.  앱 생성 완료 및 연결.

### 2.3 데이터 저장소 ID 확인
코드 연동에 필요한 ID입니다.
1.  Agent Builder > 생성한 앱 > **데이터(Data)** 메뉴 클릭.
2.  데이터 저장소 이름을 클릭하거나 URL을 확인하여 **Data Store ID**를 찾습니다.
    *   형식: `projects/YOUR_PROJECT/locations/global/collections/default_collection/dataStores/YOUR_DATA_STORE_ID`
    *   여기서 `YOUR_DATA_STORE_ID` 부분만 필요합니다. (예: `bighistory-store_12345`)

## 3. 인증 및 권한 설정 (Service Account)

서버(Next.js)가 GCP에 접근하기 위한 열쇠를 만드는 과정입니다.

1.  **IAM 및 관리자 > 서비스 계정(Service Accounts)** 이동.
2.  **서비스 계정 만들기**:
    *   이름: 예) `ai-search-agent`
3.  **역할 부여 (권한)**:
    *   서버가 검색 및 답변 생성을 하려면 다음 권한이 필요합니다.
    *   Role: **Discovery Engine 뷰어(Discovery Engine Viewer)** 혹은 **Discovery Engine 편집자**
    *   Role: **Vertex AI 사용자(Vertex AI User)**
4.  **키(Key) 생성**:
    *   생성된 서비스 계정 클릭 > **키(Keys)** 탭 > **키 추가** > **새 키 만들기** > **JSON** 선택.
    *   자동으로 다운로드된 `.json` 파일을 안전한 곳에 보관합니다.

---

## 4. 프로젝트 코드 연동 (Next.js)

### 4.1 환경 변수 설정
다운로드 받은 JSON 키 파일의 내용을 `.env.local` 파일에 환경변수로 등록해야 합니다.

```bash
# .env.local

# GCP 프로젝트 ID
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# 다운로드 받은 JSON 키 파일의 내용 전체를 한 줄의 문자열로, 혹은 압축해서 넣습니다.
# (Vercel 배포 시에는 JSON 내용을 그대로 복사해 넣으면 됩니다)
GOOGLE_APPLICATION_CREDENTIALS_JSON='{ "type": "service_account", ... }'
```

### 4.2 설정 파일 수정 (`src/lib/vertex-search.ts`)
프로젝트별로 달라지는 ID 값을 코어 로직 파일에서 수정해줍니다.

```typescript
// src/lib/vertex-search.ts

// 1. 프로젝트 ID (환경변수 사용 권장)
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;

// 2. 데이터 스토어 ID (GCP Console에서 확인한 값)
// ★ 이 부분만 교체하면 다른 PDF 지식 베이스와 연결됩니다!
const DATA_STORE_ID = 'your-new-data-store-id-12345'; 

// 3. 위치 (보통 global 혹은 us-central1 등)
const LOCATION = 'global'; 
const COLLECTION_ID = 'default_collection';
```

---

## 5. 데이터(PDF) 교체 방법 (유지보수)

"빅히스토리" 대신 다른 프로젝트(예: "사내 규정 봇")를 만들고 싶다면:

1.  **GCP Console > Cloud Storage**에 접속하여 기존 PDF들을 삭제하고, **새로운 PDF 파일(사내 규정 등)**을 업로드합니다.
2.  **Agent Builder > 데이터 저장소 > 데이터** 메뉴에서 **"가져오기(Import)"**를 실행하여 변경된 파일들을 동기화합니다.
    *   Google이 자동으로 문서를 인덱싱(색인)하는 데 몇 분~몇 시간이 소요될 수 있습니다.
3.  인덱싱이 완료되면, 코드 수정 없이도 즉시 챗봇이 새로운 문서 내용을 바탕으로 답변하게 됩니다.

---

## 6. 요약
다른 프로젝트로 복제할 때 해야 할 일은 딱 3가지입니다:
1.  **GCP에서 새 Data Store 만들고 PDF 업로드**.
2.  **Service Account 키 발급**.
3.  **`src/lib/vertex-search.ts`의 `DATA_STORE_ID` 변경**.
