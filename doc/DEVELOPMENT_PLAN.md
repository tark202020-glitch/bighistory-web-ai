# Big History AI Platform - 개발 기획서 (Technical Specification)

**Version**: Alpha V1.0
**Date**: 2026-01-04
**Author**: Antigravity Team

---

## 1. 개요 (Overview)
본 문서는 **Big History AI Platform**의 재구축 및 유지보수를 위한 기술 명세서입니다. 이 문서를 통해 서드파티 개발자나 이해관계자는 시스템의 디자인 시스템, 핵심 기능 로직, 아키텍처를 이해하고 동일한 수준의 애플리케이션을 구현할 수 있습니다.

## 2. 시스템 구성 (System Architecture)

### 2.1 Tech Stack
- **Frontend Framework**: Next.js 16.1.1 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Tailwind Animate, Typography Plugin
- **AI Core**: Google Vertex AI Search (RAG Engine)
- **Deployment**: Vercel
- **Database**: (Planned) Supabase
- **PDF Generation**: `react-to-print`

### 2.2 디렉토리 구조 (Directory Structure)
```
src/
├── app/                  # App Router Pages
│   ├── api/              # Backend API Routes (Chat, Saved Items)
│   ├── chat/             # Main Chat Interface Page
│   └── globals.css       # Global Styles & Fonts
├── components/
│   ├── chat-interface.tsx # Chat Logic & UI Wrapper
│   ├── canvas-panel.tsx   # Right-side Panel (Lecture Note, Edit, PDF)
│   ├── canvas-card.tsx    # Chat Message Card Component
│   └── message-editor.tsx # Prompt Editor
├── lib/
│   ├── prompts.ts        # System Prompts (Lecture Generation Logic)
│   ├── vertex-search.ts  # Google Vertex AI Integration Client
│   └── utils.ts          # Helper functions
```

---

## 3. 디자인 시스템 (Design System)

### 3.1 Visual Concept: "Intellectual Glass"
- **Keywords**: 지적인, 투명한, 정제된, 권위 있는
- **Glassmorphism**: 배경의 흐릿한 처리(Backdrop Blur)와 반투명한 흰색 레이어를 사용하여 깊이감 표현.

### 3.2 Typography
- **Heading Font**: `Outfit` (Modern, Sans-serif) - 세련된 제목 및 UI 요소용.
- **Body Font**:
  - Web UI: `Inter`
  - Lecture Note (Print): **`Noto Serif KR` (본문명조)** - 종이책과 같은 가독성과 신뢰감 부여.
- **Rules**:
  - `details` (답변 박스) 내부: Heading Font (`Outfit`) 사용으로 질문과의 시각적 구분.
  - 본문 줄 간격(Line Height): 1.6~1.8 (가독성 최우선).

### 3.3 Color Palette
- **Primary**: Blue-600 (`#2563EB`) - 신뢰, 지성
- **Background**: Slate-50 (`#F8FAFC`) - 눈이 편안한 미색 배경
- **Answer Box**: Slate-100 (`#F1F5F9`) - 본문과 은은하게 구별되는 회색 박스
- **Dark Mode**: Slate-900 (`#0F172A`) 지원

---

## 4. 핵심 기능 명세 (Feature Specifications)

### 4.1 듀얼 챗봇 엔진 (Dual Chat Engine)
- **일반 모드 (Q&A)**:
  - 사용자의 질문에 대해 RAG(검색 증강 생성)를 통해 빅히스토리 데이터베이스 내의 사실(Fact) 기반 답변.
- **강의 생성 모드 (Curriculum Generation)**:
  - **Prompt Logic**: `src/lib/prompts.ts` 내 정의된 페르소나 적용.
    - 공무서 스타일 금지 (`1., 가.`)
    - **Markdown Header**와 **줄글** 위주의 교과서 스타일 강제.
    - `<details>` 태그를 활용한 인터랙티브 답변 생성.

### 4.2 인터랙티브 강의 노트 (Canvas Panel)
- **답변 박스 (Answer Interaction)**:
  - `<details>` 태그가 `open` 상태가 되면:
    - `summary` (버튼)는 `display: none`으로 숨김 처리.
    - `details` 컨테이너 자체가 회색 박스로 변환 (`border`, `padding`, `background-color` 적용).
    - 내부 텍스트는 `Outfit` 폰트로 변경되어 강조됨.

### 4.3 도구 및 유틸리티
- **PDF 내보내기 (Export PDF)**:
  - 라이브러리: `react-to-print`
  - **Print Stylesheet (@media print)**:
    - `@page { margin: 20mm; size: A4; }`: A4 규격 강제.
    - Header, Sidebar, Buttons 등 UI 요소 `display: none`.
    - `break-inside: avoid` 속성으로 답변 박스가 페이지 사이에서 잘리지 않도록 처리.
- **편집 모드 (Edit Mode)**:
  - 뷰어와 에디터(Textarea) 간 상태 전환.
  - 수정 사항 실시간 반영 및 저장.

---

## 5. 복원 및 확장 가이드
본 프로젝트를 다시 구축하거나 확장할 때 다음 순서를 권장합니다.
1. `src/lib/prompts.ts`의 프롬프트 엔지니어링을 통해 AI 페르소나 확립.
2. `globals.css`의 `details[open]` CSS 로직을 이식하여 인터랙티브 UI 구현.
3. `canvas-panel.tsx`의 `useReactToPrint` 훅을 사용하여 PDF 엔진 탑재.
