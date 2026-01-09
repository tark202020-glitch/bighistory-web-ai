# Daily Development Report - 2026-01-09

## 📅 Summary
오늘 작업은 **사용자 경험(UX) 개선**과 **비용 투명성 확보**에 집중되었습니다. 사용자가 서비스 이용 시 발생하는 비용을 직관적으로 인지할 수 있도록 하고, 플랫폼의 업데이트 내역을 효과적으로 전달하는 시스템을 구축했습니다.

## ✅ Completed Tasks

### 1. 💰 Cost Estimation (과금 추정 기능)
*   **기능**: AI 답변 생성 시 발생하는 예상 비용을 실시간으로 계산하여 표시.
*   **로직**:
    *   `Vertex AI Search` 고정 비용($0.01/query) + `Gemini Pro` 토큰 비용($0.000375/1k char) 합산.
    *   API (`src/lib/vertex-search.ts`)에서 계산 후 Frontend로 전달.
*   **UI**: Chat Interface 답변 하단에 `Est. Cost: $0.0105` 배지로 표시.

### 2. 📢 Update Notification System (업데이트 알림)
*   **기능**: 로그인 직후(사이트 접속 시) 최신 변경 사항을 팝업으로 안내.
*   **개선**:
    *   초기에는 단일 최신 버전만 표시했으나, **'최근 3일간'**의 모든 작업 내역을 보여주도록 로직 확장.
    *   `CHANGELOG.md` 자동 파싱 시스템 구축 (`/api/latest-update`).
*   **User Option**: "오늘 하루 보지 않기" (LocalStorage 연동) 기능 구현.

### 3. 🧠 Prompt Engineering (프롬프트 고도화)
*   **Textbook Style**: 공문서 예시를 제거하고 교과서/전문서적 스타일 강제 적용.
*   **Metadata Guide**: `Metadata.json1` 기반의 분류 가이드(Grade, Type, Unit) 추가.
*   **HTML Structure**: `<details>` 태그를 활용한 계층적 정보 표시 구현.

### 4. 🐛 Bug Fixes & Refactoring
*   **Build Error**: `chat-interface.tsx`의 import 구문 위치 오류 수정.
*   **Rendering Issue**: `answer` vs `content` 필드 매핑 오류로 인한 강의자료 미출력 수정.

## 🚀 Deployment
*   **Version**: Alpha V1.103 -> V1.104
*   **Status**: Vercel 배포 완료.

## 📝 Next Steps
*   **Curriculum Engine**: 강의자료 생성 퀄리티 고도화 (이미지 매칭 정확도 개선 등).
*   **User Feedback**: 과금 표시 및 알림창에 대한 사용자 반응 모니터링.
