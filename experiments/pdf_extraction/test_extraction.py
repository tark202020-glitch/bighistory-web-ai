import fitz  # PyMuPDF
import os
import sys

def extract_from_pdf(pdf_path, output_dir="output"):
    """
    Extracts text and images from a PDF file.
    
    Args:
        pdf_path (str): Path to the PDF file.
        output_dir (str): Directory to save extracted images.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    try:
        doc = fitz.open(pdf_path)
        print(f"Opened PDF: {pdf_path}")
        print(f"Total Pages: {len(doc)}")
        print("-" * 30)

        total_images = 0
        
        for page_num, page in enumerate(doc):
            print(f"Processing Page {page_num + 1}...")
            
            # 1. Extract Text
            text = page.get_text()
            text_preview = text[:100].replace('\n', ' ') + "..." if len(text) > 100 else text
            print(f"  [Text] Length: {len(text)} chars | Preview: {text_preview}")

            # 2. Extract Images
            image_list = page.get_images(full=True)
            if image_list:
                print(f"  [Images] Found {len(image_list)} images.")
                for img_index, img in enumerate(image_list, start=1):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    image_filename = f"page{page_num+1}_img{img_index}.{image_ext}"
                    image_path = os.path.join(output_dir, image_filename)
                    
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    
                    print(f"    - Saved: {image_filename} ({len(image_bytes)/1024:.1f} KB)")
                    total_images += 1
            else:
                print("  [Images] No images found.")
            
            print("-" * 30)

        print(f"Extraction Complete!")
        print(f"Total Images Extracted: {total_images}")
        print(f"Check the '{output_dir}' directory for extracted files.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_extraction.py <path_to_pdf_file>")
        print("Example: python test_extraction.py sample.pdf")
    else:
        pdf_file = sys.argv[1]
        extract_from_pdf(pdf_file)
