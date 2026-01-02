# BigHistory AI 플랫폼 개발 리포트 (2026-01-02 ~ 2026-01-03)

본 리포트는 Vertex AI 기반의 Managed RAG 시스템 구축 및 Antigravity 스타일의 UI 리뉴얼 과정에서 발생한 기술적 도전 과제와 그 해결 과정을 상세히 기록합니다.

---

## 1. 핵심 성과 요약
- **Managed RAG 도입**: 단순 검색 방식에서 벗어나 Google Discovery Engine의 'Answer' API를 활용한 완벽한 Grounded Generation 시스템 구축.
- **Antigravity UI 리뉴얼**: 기존의 채팅 버블 방식을 탈피하여 Assistant의 답변을 플로팅 텍스트(Floating Text) 형태로 제공하는 미니멀 프리미엄 디자인 적용.
- **모드별 프롬프트 제어**: 일반 Q&A와 강의 자료 생성(Curriculum Generation) 모드를 구분하고, 특정 문서(`Course-prompt`)를 Grounding 가이드로 활용하는 로직 구현.

---

## 2. 주요 기술적 난관 및 해결 과정 (시행착오)

### 2.1 Vertex AI API 404 (Publisher Model Not Found) 이슈
*   **문제**: `gemini-1.5-flash` 모델을 직접 호출할 때 지속적으로 `404 Not Found` 에러 발생. API 활성화 및 IAM 권한이 완벽함에도 불구하고 프로젝트 레벨에서 모델 접근이 제한되는 현상 발생.
*   **해결**: 직접적인 모델 호출 대신, 이미 정상 작동이 확인된 **Discovery Engine 'Answer' API**로 전략 수정. 이는 데이터 검색부터 답변 생성까지 GCP 내부에서 관리되는 Managed RAG 솔루션으로, 별도의 모델 배포 없이도 가장 안정적인 답변을 보장함.

### 2.2 Discovery Engine API 페이로드 오류
*   **문제**: Answer API 호출 시 `modelId` 파라미터를 사용했으나, '지원하지 않는 파라미터'라는 에러 발생.
*   **해결**: API 문서를 정밀 분석하여 `modelId` 대신 `modelVersion`을 사용하거나, `modelSpec`을 빈 객체로 전달하여 GCP가 최적의 모델을 자동으로 선택하도록 수정하여 해결.

### 2.3 UI 리팩토링 중 구문 오류 (Syntax Errors)
*   **문제**: 복잡한 Antigravity UI를 한 번에 적용하는 과정에서 `ChatInterface.tsx` 파일 내부에 중첩된 함수 및 JSX 태그 닫기 누락으로 인한 빌드 에러 발생.
*   **해결**: 전체 컴포넌트 구조를 다시 설계하고, 논리적 단위(사이드바, 메시지 컨테이너, 입력창)로 코드를 정리하여 재작성. `MessageEditor` 컴포넌트까지 통합하여 정합성 확보.

### 2.4 JSON 응답 파싱 및 Citation 렌더링
*   **문제**: 초기 연동 시 Assistant 답변이 raw JSON 형태로 출력되는 현상 발생.
*   **해결**: Frontend에서 `fetch` 결과로 들어오는 `data.content`를 즉시 반영하고, `data.annotations` 내부에 포함된 `citations` 배열을 추출하여 답변 하단에 **'Verification Sources'** 섹션으로 시각화함.

---

## 3. 구현 상세 (Implementation Details)

### 3.1 Managed Prompting (Curriculum Generation)
- 사용자가 하단 토글에서 `Lecture` 모드를 선택하면, backend는 자동으로 `doc/Course-prompt` 파일을 시스템 프롬프트(Preamble)로 주입합니다.
- 이를 통해 인공지능이 임의로 답변하지 않고, 사용자가 정의한 1차/2차 조건(단원 목표, 학년별 가이드라인 등)을 엄격히 준수합니다.

### 3.2 Design System (Antigravity Style)
- **Primary Color**: `#0f172a` (Slate 900)
- **Accent Color**: `linear-gradient(to right, #3b82f6, #6366f1)` (Blue to Indigo)
- **Typography**: Inter (UI), Outfit (Heading)
- **Layout**: 기존의 좌우 대칭형 버블 구조를 파괴하고, 정보의 흐름을 중시하는 **문서형 레이아웃** 채택.

---

## 4. 향후 과제 (Next Steps)
1.  **PDF/이미지 업로드 기능**: 현재 데이터 저장소 기반 답변에서 나아가, 사용자가 직접 올린 파일에 대한 즉각적인 분석 기능 추가.
2.  **답변 보관함(Library) 고도화**: 저장된 인사이트를 카테고리별로 분류하고 PDF로 내보내는 기능 구현.
3.  **스트리밍 응답 개선**: 현재 JSON 통 방식의 응답을 가독성 향상을 위해 실시간 스트리밍(SSE) 방식으로 고도화 검토.

---

**작성일**: 2026년 1월 3일
**작성자**: Antigravity (AI Assistant)
