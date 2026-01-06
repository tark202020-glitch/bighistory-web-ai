# PDF 추출 테스트 가이드

이 디렉토리는 `PyMuPDF` 라이브러리를 사용하여 PDF 파일에서 텍스트와 이미지를 추출하는 기능을 테스트하기 위한 실험 공간입니다.

## 사전 준비

1.  **Python 설치 확인**: Python 3.x가 설치되어 있어야 합니다.
2.  **가상 환경 권장**: (선택 사항) 가상 환경을 만들어 테스트하는 것을 권장합니다.
3.  **라이브러리 설치**: 아래 명령어로 필요한 라이브러리를 설치하세요.

```bash
pip install pymupdf
```

## 사용 방법 (Usage)

터미널에서 이 디렉토리(`experiments/pdf_extraction`)로 이동한 후, 원하는 방식의 스크립트를 실행하세요.

### 1. 기본 추출 (Basic)
이미지와 텍스트를 단순 추출합니다. (노이즈 많음)
```bash
python test_extraction.py <PDF파일경로>
```

### 2. 박스 기반 영역 추출 (Box-Based, 추천)
화면의 틀(Frame/Box)을 인식하여 카드 형태로 온전하게 추출합니다. **(가장 권장되는 방식)**
```bash
python box_extraction.py <PDF파일경로>
```
> 상세 원리는 `../../doc/PDF_BOX_EXTRACTION_GUIDE.md`를 참고하세요.

## 결과 확인
- **output**: 기본 추출 결과 (이미지 파편화 심함)
- **output_box**: 박스 기반 추출 결과 (추천)

