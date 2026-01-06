import fitz  # PyMuPDF
import os
import sys

# === 설정 (Configuration) ===
# doc/PDF_IMAGE_EXTRACTION_SETTINGS.md 파일을 참고하여 값을 조정하세요.
CONFIG = {
    "MIN_WIDTH": 200,          # 최소 가로 픽셀 (기존 100 -> 200 상향)
    "MIN_HEIGHT": 200,         # 최소 세로 픽셀
    "MIN_FILE_SIZE_KB": 10,    # 최소 파일 용량 (KB)
    "ASPECT_RATIO_LIMIT": 4.0, # 가로/세로 비율 제한 (너무 길쭉한 이미지 제외)
}
# ============================

def extract_images_from_pdf(pdf_path, output_dir="temp_images"):
    """
    PDF에서 이미지를 추출하여 저장합니다. (CONFIG 설정 적용)
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    doc = fitz.open(pdf_path)
    file_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    print(f"Processing: {pdf_path} ({len(doc)} pages)")
    print(f"Filters: Min Size {CONFIG['MIN_WIDTH']}x{CONFIG['MIN_HEIGHT']}, Min KB {CONFIG['MIN_FILE_SIZE_KB']}")
    
    total_images = 0
    ignored_images = 0
    
    for page_index in range(len(doc)):
        page = doc[page_index]
        image_list = page.get_images(full=True)
        
        if image_list:
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]
                size_kb = len(image_bytes) / 1024
                
                # 1. 크기 필터
                if width < CONFIG["MIN_WIDTH"] or height < CONFIG["MIN_HEIGHT"]:
                    ignored_images += 1
                    continue
                
                # 2. 용량 필터
                if size_kb < CONFIG["MIN_FILE_SIZE_KB"]:
                    ignored_images += 1
                    continue
                    
                # 3. 비율 필터 (너무 길거나 납작한 이미지 제외)
                ratio = width / height if height > 0 else 0
                if ratio > CONFIG["ASPECT_RATIO_LIMIT"] or ratio < (1 / CONFIG["ASPECT_RATIO_LIMIT"]):
                    ignored_images += 1
                    continue
                
                image_filename = f"{file_name}_p{page_index + 1:03d}_{img_index + 1:02d}.{image_ext}"
                image_path = os.path.join(output_dir, image_filename)
                
                with open(image_path, "wb") as f:
                    f.write(image_bytes)
                
                total_images += 1

    print(f"Done. Extracted {total_images} images (Ignored {ignored_images} small/irrelevant images) to '{output_dir}/'")

if __name__ == "__main__":
    # 테스트할 파일 경로
    target_pdf = "15-Main.pdf"
    
    # 명령줄 인수로 파일 경로를 받을 수도 있음
    if len(sys.argv) > 1:
        target_pdf = sys.argv[1]
        
    if os.path.exists(target_pdf):
        extract_images_from_pdf(target_pdf)
    else:
        print(f"File not found: {target_pdf}")
        print("Please provide a valid PDF file path.")
