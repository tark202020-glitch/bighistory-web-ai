# Changelog

All notable changes to the **Big History AI Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).















## [Alpha V1.108] - 2026-01-11

### �️ Infrastructure & Build (인프라 및 빌드)
- **Deployment Fix**:
  - Vercel 빌드 시 발생하는 `SyntaxError: Bad control character` 에러 해결 (환경변수 JSON 파싱 로직 개선).
  - API 라우트(`vertex-search.ts`, `api/chat`, `api/test-vertex`)의 중복/잘못된 Credential 초기화 코드 정리.

### 🖼️ Image Integration (이미지 연동 복구)
- **Heuristic Page Extraction**:
  - Vertex AI Search 결과에서 메타데이터가 없는 경우, 파일명(`..._p023_...`)에서 페이지 번호를 자동 추출하는 로직 구현.
  - "실크로드 지도" 등 청크 단위 검색 시 이미지가 누락되던 문제 해결.

## [Alpha V1.107] - 2026-01-10

### 🖼️ Image Integration Fix (이미지 연동 수정)
- **Architecture Update (New App)**:
  - 기존 앱 설정 문제 해결을 위해 **새로운 Vertex AI App**으로 마이그레이션 (`BigHistory-Search-V2`).
  - **Layout-based Chunking** 설정이 적용된 신규 스토어(`bighistory-set-raw-chunking...`)를 정식 연결.
  - 검색 결과에서 **페이지 번호(Page Number)** 메타데이터를 정상적으로 추출하여 이미지 매칭 성공률 향상.
  - **Gen AI (LLM Add-on)** 기능 활성화로 요약/답변 API 정상화.


## [Alpha V1.106] - 2026-01-10

### 🧠 Prompt Engineering (프롬프트 확장)
- **Prompt Logic Update (`src/lib/prompts.ts`)**:
  - **Further Reading (더 읽어보기)**: `ReferenceBooks` 데이터를 기반으로 관련 도서 추천 섹션 추가.
  - **Supplementary Materials (보조자료)**: 연계 진로 및 국내 견학 프로그램 소개 섹션 추가.

### 📚 Documentation (문서화)
- **Topic Selection Process (`doc/주제선정.md`)**: RAG 검색부터 프롬프트 해석, 단원 목표/핵심 질문 생성까지의 기술적 프로세스 정의 문서 추가.

## [Alpha V1.105] - 2026-01-10

### 🧠 AI Logic & Prompt Engineering
- **Prompt Logic Update (`src/lib/prompts.ts`)**:
  - **Textbook Style Enforcement**: 공문서 스타일을 배제하고, 전문 서적/인쇄물 스타일의 답변 형식을 강제 적용했습니다.
  - **HTML Structuring**: 핵심 질문 및 개념 설명에 `<details>` 태그를 사용하여 가독성과 상호작용성을 높였습니다.
  - **Metadata Guide**: `Metadata.json1`의 구조(Grade, Type, Unit)를 AI가 이해하고 활용할 수 있도록 가이드를 추가했습니다.

## [Alpha V1.104] - 2026-01-09

### 📢 User Engagement (사용자 소통)
- **Update Notification Modal**:
  - 접속 시 **최근 3일간**의 업데이트 내역을 모두 통합하여 팝업으로 안내합니다.
  - **오늘 하루 보지 않기** 기능을 제공하여 사용자 경험을 방해하지 않도록 설계했습니다.

## [Alpha V1.103] - 2026-01-09

### 🐛 Bug Fixes (버그 수정)
- **API Response Mapping**: `answer` 필드 매핑 오류로 인한 강의자료 내용 누락 현상 수정.
- **Cost Display**: 프론트엔드 상태 업데이트에서 누락된 `estimatedCost` 연결 복구.

### 💰 Cost Management (비용 관리)
- **Real-time Cost Estimation**:
  - Vertex AI Search 및 Gemini 토큰 사용량을 기반으로 한 **질문당 예상 비용($)** 표시 기능 추가.
  - 답변 하단에 `Est. Cost: $0.0105` 형태로 투명하게 정보 제공.

## [Alpha V1.102] - 2026-01-07

### 🖼️ Multimodal & Image Features (이미지 기능강화)
- **Context-Aware Image Injection**:
  - Vertex AI Search 결과에서 검색된 문서의 '페이지 번호(Page)'를 추출.
  - 해당 페이지와 일치하는 이미지(도표, 삽화 등)를 GCS 버킷에서 찾아 LLM Context에 주입.
  - 강의자료 생성 시 본문에 관련 이미지가 자동으로 삽입되도록 구현 (현재 데이터 Import 이슈로 일시 지연).

### 🎨 Visual & UI UX (사용자 경험)
- **Mode-Specific Styling (채팅 모드 시각적 구분)**:
  - **Curriculum Generation Mode**:
    - 사용자 메시지 버블을 **파란색(Brand Blue)**으로 변경하여 모드 인지 강화.
    - AI 응답 헤더를 `✨ Curriculum Engine` + **Sparkles 아이콘**으로 변경.
  - **Detailed Q&A Mode**:
    - 기존의 검정색 메시지 및 `🤖 Research Logic` 헤더 유지.

### 🐛 Infrastructure & Debugging (인프라)
- **Vertex AI Data Store ID Verification**:
  - 검색 기능 중단 문제 디버깅 수행 (`scripts/debug-injection-logic.js`).
  - 원인: Vertex AI Console 상의 **대량 데이터 가져오기(Import) 작업**으로 인한 인덱스 Lock/지연 현상 확인.
  - 조치: 데이터 업로드 주기를 서비스 비가동 시간으로 조정 권고.

## [Alpha V1.015] - 2026-01-06 13:03:40

### 🔄 Build Update
- **Summary**: Feat: Multimodal Image Integration in Lecture Generation
- **Build Time**: 2026-01-06 13:03:40

## [Alpha V1.014] - 2026-01-06 12:47:09

### 🔄 Build Update
- **Summary**: Feat: Multimodal Image Extraction & Chat Scroll Improvement
- **Build Time**: 2026-01-06 12:47:09

## [Alpha V1.013] - 2026-01-04 17:54:30

### 🔄 Build Update
- **Summary**: Documentation: Created User Manual Draft
- **Build Time**: 2026-01-04 17:54:30

## [Alpha V1.012] - 2026-01-04 17:08:41

### 🔄 Build Update
- **Summary**: Content Update: Target Audience & Roadmap Sections
- **Build Time**: 2026-01-04 17:08:41

## [Alpha V1.011] - 2026-01-04 17:07:14

### 🔄 Build Update
- **Summary**: Content Update: Landing Page Comparison Table
- **Build Time**: 2026-01-04 17:07:14

## [Alpha V1.010] - 2026-01-04 17:02:44

### 🔄 Build Update
- **Summary**: Visual Update: Landing Page Theme Harmonization (Blue/Slate)
- **Build Time**: 2026-01-04 17:02:44

## [Alpha V1.009] - 2026-01-04 16:57:56

### 🔄 Build Update
- **Summary**: Visual Update: App Interface Mockup on Landing Page
- **Build Time**: 2026-01-04 16:57:56

## [Alpha V1.008] - 2026-01-04 16:50:38

### 🔄 Build Update
- **Summary**: Fix: Chat Layout Gap & Landing Page Text
- **Build Time**: 2026-01-04 16:50:38

## [Alpha V1.007] - 2026-01-04 16:41:02

### 🔄 Build Update
- **Summary**: Specific Content Refinements (10s Claim, Visual Timeline)
- **Build Time**: 2026-01-04 16:41:02

## [Alpha V1.006] - 2026-01-04 16:32:36

### 🔄 Build Update
- **Summary**: MagicSchool AI Concept Redesign
- **Build Time**: 2026-01-04 16:32:36

## [Alpha V1.005] - 2026-01-04 16:24:26

### 🔄 Build Update
- **Summary**: Refined Landing Page (Text Swap & Removed Hero Image)
- **Build Time**: 2026-01-04 16:24:26

## [Alpha V1.004] - 2026-01-04 16:10:21

### 🔄 Build Update
- **Summary**: Landing Page Redesign (PRODUCT_PITCH.md aligned)
- **Build Time**: 2026-01-04 16:10:21

## [Alpha V1.003] - 2026-01-04 16:09:58

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Build Time**: 2026-01-04 16:09:58

## [Alpha V1.002] - 2026-01-04 15:35:39

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Build Time**: 2026-01-04 15:35:39

## [Alpha V1.001] - 2026-01-04 15:35:20

### 🔄 Build Update
- **Summary**: $npm_config_msg
- **Build Time**: 2026-01-04 15:35:20

## [Alpha V1.101] - 2026-01-05

### 📱 Mobile Experience (모바일 최적화)
- **Exclusive View Mode**: 
  - 모바일 환경에서 채팅창, 강의노트, 라이브러리가 겹치지 않고 한 번에 하나씩 온전히 보이도록 개선.
  - 강의노트(Canvas)가 열리면 채팅창이 숨겨지고 독립적인 영역 확보.
- **Header Simplification**: 모바일에서 로고만 깔끔하게 표시되도록 헤더 UI 단순화.
- **Input Area Fix**: 플로팅 입력창이 컨텐츠를 가리거나 겹치는 현상 해결.

### 👤 User Management (사용자 관리)
- **Supabase Integration**: 
  - 기존 로컬 스토리지 방식을 Supabase Auth & DB로 전면 교체.
  - 이름 설정, 비밀번호 변경, 로그인 상태 유지가 기기 간 동기화됨.
- **Sign-Up Flow**: 회원가입 시 '이름(Display Name)' 입력 필드 추가.

### 🐛 Bug Fixes & Improvements (개선사항)
- **Canvas Visibility**: 모바일에서 강의노트가 렌더링되지 않던 치명적 버그 수정.
- **Library Titles**: 
  - 강의노트 저장 시, '질문 내용(Prompt)'을 자동으로 제목으로 추출하여 저장.
  - 제목이 길어도 잘리지 않도록 UI 레이아웃 개선.
- **Reliability**: Google Vertex AI 검색/응답 실패 시 3회 자동 재시도(Retry) 로직 추가 (500 오류 방지).

## [Alpha V1.0] - 2026-01-04

### 🚀 Major Features (주요 기능)
- **Vertex AI RAG Integration**: 구글 Vertex AI Search 기반의 RAG(검색 증강 생성) 챗봇 엔진 구축.
- **Dual Mode Interface**:
  - **Q&A Mode**: 일반적인 빅헤스토리 지식 질문 및 답변.
  - **Curriculum Generation Mode**: "빅히스토리 전문가" 페르소나를 통한 맞춤형 강의 노트 생성.
- **Library System**: 생성된 답변 및 강의 노트를 로컬 데이터베이스(Supabase 연동 예정/현재 Mock)에 저장 및 삭제.

### 🎨 UI/UX Improvements (디자인 및 경험)
- **"Textbook" Style Optimization**:
  - 강의 노트 가독성을 위한 **Noto Serif KR (본문명조)** 폰트 적용.
  - 공무서 스타일(1., 가.)을 배제하고, 세련된 서적 스타일의 줄글 및 제목 포맷 적용.
- **Interactive Answer Box**:
  - 핵심 질문의 '답변' 버튼 클릭 시, 부드러운 애니메이션과 함께 박스 형태의 상세 답변으로 전환.
  - 직관적인 사용자 경험(UX) 제공.
- **Glassmorphism Design**: 최신 트렌드를 반영한 반투명 유리 질감의 모던한 UI 디자인.

### 🛠 Tools & Utilities (도구)
- **PDF Export**:
  - 강의 노트를 즉시 A4 규격의 PDF로 변환하여 저장하는 기능 탑재.
  - 인쇄 시 불필요한 UI(버튼 등)를 자동 숨김 처리하여 깔끔한 출력물 제공.
- **Edit Mode**:
  - 생성된 강의 노트를 사용자가 직접 수정할 수 있는 Markdown 에디터 제공.

---
*Created by Antigravity Team*
