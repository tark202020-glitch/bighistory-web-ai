import fitz
import os
import sys

def is_contained(inner, outer):
    """
    Checks if 'inner' rect is completely inside 'outer' rect.
    """
    return (
        inner.x0 >= outer.x0 and
        inner.y0 >= outer.y0 and
        inner.x1 <= outer.x1 and
        inner.y1 <= outer.y1
    )

def extract_boxes(pdf_path, output_dir="output_box"):
    """
    Extracts content within distinct 'box' structures (outermost containers).
    Captures the area as a screenshot (preserving text layout and styles).
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    doc = fitz.open(pdf_path)
    print(f"Opened with Box Extraction: {pdf_path}")
    print("-" * 30)
    
    total_captured = 0

    for page_num, page in enumerate(doc):
        # Page dimensions
        page_w = page.rect.width
        page_h = page.rect.height
        page_area = page_w * page_h

        drawings = page.get_drawings()
        
        # 1. Collect all potential rectangular candidates
        candidates = []
        for shape in drawings:
            rect = shape['rect']
            width = rect.width
            height = rect.height
            area = width * height
            
            # Filter: Minimum Size (e.g., 50x50) to ignore tiny icons/checkboxes
            if width < 50 or height < 50:
                continue
                
            # Filter: Maximum Size (exclude full page borders)
            # If a rect covers > 95% of the page, it's likely a background or border.
            if area > (page_area * 0.95):
                continue
            
            # Deduplication Check (exact or very close matches)
            is_duplicate = False
            for existing_rect in candidates:
                if abs(existing_rect.x0 - rect.x0) < 2 and abs(existing_rect.y0 - rect.y0) < 2 and \
                   abs(existing_rect.width - width) < 2 and abs(existing_rect.height - height) < 2:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                candidates.append(rect)
        
        # 2. Container Logic (Remove nested boxes)
        # Sort by Area Descending (Largest to Smallest)
        candidates.sort(key=lambda r: r.width * r.height, reverse=True)
        
        final_boxes = []
        for candidate in candidates:
            # Check if this candidate is contained in any already selected (larger) box
            is_nested = False
            for selected in final_boxes:
                if is_contained(candidate, selected):
                    is_nested = True
                    break
            
            if not is_nested:
                final_boxes.append(candidate)

        # 3. Capture Selected Boxes
        if final_boxes:
            print(f"Processing Page {page_num + 1}: Found {len(final_boxes)} outermost boxes.")
            
            # Sort again by vertical position (y0) for logical file ordering
            final_boxes.sort(key=lambda r: r.y0)

            for i, rect in enumerate(final_boxes, start=1):
                # Buffer: Add small padding to capture stroke width safely
                clip = fitz.Rect(rect.x0 - 2, rect.y0 - 2, rect.x1 + 2, rect.y1 + 2)
                
                # Ensure clip is within page bounds
                clip = clip & page.rect 

                # High resolution zoom (2x)
                mat = fitz.Matrix(2, 2)
                pix = page.get_pixmap(matrix=mat, clip=clip)
                
                # Save
                filename = f"p{page_num+1}_box_{i}.png"
                filepath = os.path.join(output_dir, filename)
                pix.save(filepath)
                
                total_captured += 1

    print("-" * 30)
    print(f"Extraction Complete. Total Boxes Captured: {total_captured}")
    print(f"Output Directory: {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python box_extraction.py <pdf_path>")
    else:
        extract_boxes(sys.argv[1])
