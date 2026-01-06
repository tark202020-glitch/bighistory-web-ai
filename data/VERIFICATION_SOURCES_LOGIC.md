# Verification Sources Logic Documentation

본 문서는 BigHistory AI 플랫폼에서 "Verification sources"(검증된 출처)를 표기하는 개발 로직을 설명합니다.

## 개요
Verification sources는 Google Vertex AI Search (Discovery Engine)의 **Managed Answer API**를 통해 생성된 답변과 함께 제공되는 인용(Citations) 및 참조(References) 데이터를 활용합니다.

## 시스템 흐름

### 1. 데이터 검색 및 답변 생성 요청 (`src/lib/vertex-search.ts`)
백엔드 로직인 `answerQuery` 함수에서 Google Cloud Discovery Engine API의 `:answer` 엔드포인트를 호출합니다. 이때, 출처 정보를 포함하도록 `includeCitations` 옵션을 `true`로 설정합니다.

```typescript
// src/lib/vertex-search.ts

const endpoint = `https://discoveryengine.googleapis.com/.../servingConfigs/default_search:answer`;

const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
        query: { text: query },
        answerGenerationSpec: {
            ignoreAdversarialQuery: true,
            includeCitations: true, // [중요] 인용 정보 요청
            promptSpec: { ... },
            modelSpec: {}
        }
    })
});
```

### 2. 응답 데이터 구조 처리
API 응답에는 생성된 `answerText` 외에 `citations`과 `references` 배열이 포함됩니다.

- **citations**: 답변의 특정 부분이 어떤 소스에서 왔는지 인덱스로 매핑합니다.
- **references**: 인용된 실제 문서의 메타데이터(제목, 링크, 파일 출처 등)를 포함합니다.

```typescript
// API Response Example Structure
{
  "answer": {
    "answerText": "...",
    "citations": [
      {
        "startIndex": 0,
        "endIndex": 100,
        "sources": [ { "referenceId": "..." } ]
      }
    ],
    "references": [
      {
        "id": "...",
        "title": "Document Title",
        "link": "gs://...",
        "chunkInfo": { ... }
      }
    ]
  }
}
```

### 3. API 라우트 전달 (`src/app/api/chat/route.ts`)
Next.js API 라우트는 `answerQuery`의 결과를 그대로 클라이언트에 JSON 형태로 반환합니다.

```typescript
// src/app/api/chat/route.ts
const { answerText, citations, references } = await answerQuery(...);

return Response.json({
    role: 'assistant',
    content: answerText,
    citations: citations, // 클라이언트로 전달
    references: references // 클라이언트로 전달
});
```

### 4. 프론트엔드 표시 (`src/components/chat-interface.tsx`)
클라이언트(ChatInterface)는 응답받은 `citations` 데이터를 활용하여, 답변 하단이나 텍스트 내부(각주 형태)에 출처를 시각적으로 표시합니다.
- 답변 하단에 "Citations" 또는 "References" 섹션을 렌더링하거나,
- 텍스트 내 `[1]`, `[2]`와 같은 각주를 클릭하면 해당 문서의 제목과 링크를 보여주는 방식으로 구현됩니다.

## 요약
1.  **Source**: Google Cloud Storage (`20set-bighistory-raw` 버킷)에 저장된 PDF 데이터.
2.  **Engine**: Google Vertex AI Search & Conversation이 RAG(Retrieval-Augmented Generation)를 수행.
3.  **Transport**: `includeCitations: true` 옵션으로 API 호출 -> `citations` 객체 수신 -> 프론트엔드 전달.
4.  **Display**: 프론트엔드에서 해당 객체를 파싱하여 UI에 노출.
