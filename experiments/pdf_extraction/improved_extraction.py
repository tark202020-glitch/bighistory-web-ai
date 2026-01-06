import fitz  # PyMuPDF
import os
import sys
import hashlib
import io

def get_image_hash(image_bytes):
    """Calculates MD5 hash of image bytes for deduplication."""
    return hashlib.md5(image_bytes).hexdigest()

def extract_advanced(pdf_path, output_dir="output_improved"):
    """
    Extracts text, images, and tables from a PDF with post-processing.
    
    Features:
    - Filters small images (icons, decorations).
    - Removes duplicate images.
    - Extracts tables as images.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Directories for categories
    img_dir = os.path.join(output_dir, "images")
    table_dir = os.path.join(output_dir, "tables")
    os.makedirs(img_dir, exist_ok=True)
    os.makedirs(table_dir, exist_ok=True)

    try:
        doc = fitz.open(pdf_path)
        print(f"Opened PDF: {pdf_path}")
        print(f"Total Pages: {len(doc)}")
        print("-" * 30)

        # Statistics
        stats = {
            "total_images_found": 0,
            "saved_images": 0,
            "skipped_small": 0,
            "skipped_duplicate": 0,
            "extracted_tables": 0
        }
        
        seen_hashes = set()

        for page_num, page in enumerate(doc):
            print(f"Processing Page {page_num + 1}...")

            # --- 1. Image Extraction (with Filtering & Dedup) ---
            image_list = page.get_images(full=True)
            stats["total_images_found"] += len(image_list)
            
            for img_index, img in enumerate(image_list, start=1):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]
                size_kb = len(image_bytes) / 1024

                # Filter 1: Size & Dimension (Skip small icons/lines)
                # Criteria: < 2KB OR either dimension < 100px OR extreme aspect ratio
                is_small = size_kb < 2.0
                is_tiny_dim = width < 100 or height < 100
                
                # Check aspect ratio (to filter thin lines)
                aspect_ratio = width / height if height > 0 else 0
                is_extreme_ratio = aspect_ratio > 10 or aspect_ratio < 0.1

                if is_small or is_tiny_dim or is_extreme_ratio:
                    stats["skipped_small"] += 1
                    continue

                # Filter 2: Deduplication
                img_hash = get_image_hash(image_bytes)
                if img_hash in seen_hashes:
                    stats["skipped_duplicate"] += 1
                    continue
                
                seen_hashes.add(img_hash)

                # Save Image
                image_filename = f"p{page_num+1}_{img_index}.{image_ext}"
                image_path = os.path.join(img_dir, image_filename)
                
                with open(image_path, "wb") as f:
                    f.write(image_bytes)
                
                stats["saved_images"] += 1

            # --- 2. Table Extraction (Snapshot) ---
            tables = page.find_tables()
            if tables.tables:
                print(f"  [Tables] Found {len(tables.tables)} tables.")
                for i, table in enumerate(tables.tables, start=1):
                    # Get bbox of the table
                    bbox = table.bbox
                    # Clip coordinates must be wrapped in fitz.Rect for consistency
                    clip = fitz.Rect(bbox)
                    
                    # Take a screenshot (pixmap) of the table area
                    # Matrix(2, 2) creates 2x zoom for better resolution
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip)
                    
                    table_filename = f"p{page_num+1}_table_{i}.png"
                    table_path = os.path.join(table_dir, table_filename)
                    pix.save(table_path)
                    
                    stats["extracted_tables"] += 1
            
        print("-" * 30)
        print("Extraction Complete!")
        print("Summary Statistics:")
        print(f"  Total Images Found  : {stats['total_images_found']}")
        print(f"  Saved Images        : {stats['saved_images']} (Filtered & Unique)")
        print(f"  Skipped (Small/Line): {stats['skipped_small']}")
        print(f"  Skipped (Duplicate) : {stats['skipped_duplicate']}")
        print(f"  Extracted Tables    : {stats['extracted_tables']}")
        print(f"Output Directory: {output_dir}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python improved_extraction.py <path_to_pdf_file>")
    else:
        pdf_file = sys.argv[1]
        extract_advanced(pdf_file)
