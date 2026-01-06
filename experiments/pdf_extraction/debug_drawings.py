import fitz

def inspect_drawings(pdf_path, page_num=20):
    doc = fitz.open(pdf_path)
    page = doc[page_num]  # Inspector specific page (0-indexed)
    
    print(f"--- Drawings on Page {page_num + 1} ---")
    drawings = page.get_drawings()
    print(f"Total drawings found: {len(drawings)}")
    
    for i, shape in enumerate(drawings[:20]): # Show first 20
        rect = shape['rect']
        type_name = shape['type'] # s (stroke), f (fill), etc
        items = shape['items'] # (op, p1, p2, ...)
        
        width = rect.width
        height = rect.height
        
        print(f"Shape {i+1}: Type={type_name}, Rect={rect}, W={width:.1f}, H={height:.1f}")
        # Detect if it looks like a box (rectangle path)
        if len(items) == 1 and items[0][0] == 're':
            print(f"  -> RECTANGLE DETECTED! {items[0]}")
        elif len(items) >= 4:
            # Check for 4-line closed path?
            print(f"  -> Complex Path: {len(items)} segments")

if __name__ == "__main__":
    # Page 21 (index 20) had many images, might have boxes.
    # Page 25 (index 24) had Andromeda galaxy images.
    inspect_drawings("../../data/01.pdf", page_num=20) 
    print("\n" + "="*30 + "\n")
    inspect_drawings("../../data/01.pdf", page_num=24)
