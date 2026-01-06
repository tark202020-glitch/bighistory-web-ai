# PDF 박스 영역 추출 가이드 (Box-Based Extraction)

## 개요
단순 이미지 파일 추출(Extract Image) 방식이 아닌, **"화면상의 특정 박스(테두리) 영역"**을 인식하여 스크린샷 형태로 캡처하는 기술 가이드입니다.
이 방식을 사용하면 다음 장점이 있습니다.

1.  **레이아웃 유지**: 박스 내부에 텍스트와 이미지가 섞여 있어도 보이는 그대로 저장합니다.
2.  **노이즈 제거**: 의미 없는 장식이나 아이콘을 개별적으로 추출하지 않고, 큰 틀(컨테이너) 단위로 가져옵니다.
3.  **그대로 추출**: 박스 내부에 표, 그림, 텍스트가 섞여 있어도 보이는 화면 그대로를 캡처하여 저장합니다.

## 핵심 로직 (Algorithm)

### 1. Vector Path 분석
PDF는 이미지가 아닌 **벡터 드로잉(Rect, Path)**으로 테두리를 그리는 경우가 많습니다. `PyMuPDF`의 `page.get_drawings()` 함수를 통해 이 사각형 경로들을 탐색합니다.

### 2. 박스 내부 콘텐츠 유지 (Outer Box Only)
**"박스(테두리) 내부의 그림/표/텍스트는 그대로 유지하여 추출해야 합니다."**
단순히 모든 사각형을 잡는 것이 아니라, 가장 바깥쪽의 틀(Frame)을 기준으로 잡아야 합니다.

> **핵심 원칙**:
> 1. 박스 형태(테두리)가 감지되면 그 내부 영역 전체를 이미지화합니다.
> 2. 단, **박스 내부에 있는 또 다른 이미지나 객체를 별도로 다시 추출하지 않습니다.** (중복 추출 방지)

### 3. 영역 캡처 (Snapshot)
선택된 영역(Region of Interest)에 대해 `page.get_pixmap(clip=rect)`을 실행하여 해당 부분만 고해상도 이미지(PNG)로 저장합니다.

## 코드 예시 (Python)

```python
import fitz

def extract_outermost_boxes(pdf_path):
    doc = fitz.open(pdf_path)
    
    for page in doc:
        drawings = page.get_drawings()
        candidates = []
        
        # 1. 사각형 후보 수집
        for shape in drawings:
            rect = shape['rect']
            # 너무 작거나(아이콘), 너무 큰(페이지 테두리) 영역 제외
            if rect.width > 50 and rect.height > 50:
                candidates.append(rect)
        
        # 2. 포함 관계 분석 (중첩 제거)
        # 면적 기준으로 내림차순 정렬 (큰 박스부터 확인)
        candidates.sort(key=lambda r: r.width * r.height, reverse=True)
        final_boxes = []
        
        for cand in candidates:
            # 이미 선택된 박스들(더 큰 박스) 안에 포함되는지 확인
            is_nested = False
            for parent in final_boxes:
                if (cand.x0 >= parent.x0 and cand.y0 >= parent.y0 and 
                    cand.x1 <= parent.x1 and cand.y1 <= parent.y1):
                    is_nested = True
                    break
            
            if not is_nested:
                final_boxes.append(cand)
                
        # 3. 이미지 저장
        for i, box in enumerate(final_boxes):
            # 2배 확대(Matrix(2,2))로 고화질 캡처
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=box)
            pix.save(f"page_{page.number}_box_{i}.png")
```

## 결론
이 방식은 "이미지 파일 그 자체"를 추출하는 것이 아니라, **"사람이 보는 화면의 구성 요소(위젯, 카드, 박스 등)"**를 추출하는 데 매우 효과적입니다. 학습 자료나 강의 노트 PDF에서 특정 섹션을 통째로 잘라내어 활용할 때 추천합니다.
