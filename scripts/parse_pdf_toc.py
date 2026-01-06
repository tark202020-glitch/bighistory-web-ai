
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from google.cloud import storage
import json
import os
import re

# 설정
PROJECT_ID = "rag-bighistory"  # GCP 프로젝트 ID
LOCATION = "us-central1"
BUCKET_NAME = "20set-bighistory-raw"
OUTPUT_FILE = "toc_analysis_results.json"

def get_gcs_pdf_files(bucket_name):
    """GCS 버킷에서 _Content.pdf 로 끝나는 파일 목록을 가져옵니다."""
    try:
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)
        blobs = bucket.list_blobs()
        
        pdf_files = []
        for blob in blobs:
            # -Content.pdf (실제 버킷) 또는 _Content.pdf (예시) 모두 지원
            if blob.name.endswith("-Content.pdf") or blob.name.endswith("_Content.pdf"):
                pdf_files.append(f"gs://{bucket_name}/{blob.name}")
                
        return pdf_files
    except Exception as e:
        print(f"Error accessing GCS: {e}")
        return []

def parse_toc_pdf_from_gcs(gcs_uri, model):
    """
    GCS URI에 있는 PDF를 Gemini로 분석합니다.
    """
    print(f"Processing: {gcs_uri}...")
    
    prompt = """
    You are a helpful assistant that extracts table of contents from a book PDF.
    
    Task:
    1. Look at the provided document image (Table of Contents).
    2. Extract every chapter title and its starting page number.
    3. Return the result as a raw JSON list. Do not include markdown formatting (```json ... ```).
    
    JSON Format:
    [
        {"title": "Chapter Title 1", "page": 5},
        {"title": "Chapter Title 2", "page": 12}
    ]
    
    Constraint: Include all items like '서문', '추천사', '타임라인' if they appear with page numbers.
    """
    
    try:
        # GCS URI에서 직접 Part 생성
        document = Part.from_uri(uri=gcs_uri, mime_type="application/pdf")

        # 모델 호출
        responses = model.generate_content(
            [document, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        
        raw_response = responses.text.strip()
        
        # JSON 파싱
        if raw_response.startswith("```json"):
            raw_response = raw_response[7:-3]
        elif raw_response.startswith("```"): # 가끔 언어 지정 없이 백틱만 올 때 처리
            raw_response = raw_response[3:-3]
            
        toc_data = json.loads(raw_response)
        return toc_data
    except Exception as e:
        print(f"Failed to process {gcs_uri}: {e}")
        return []

def format_toc_ranges(toc_data):
    """
    시작 페이지 정보를 바탕으로 페이지 범위를 계산합니다.
    """
    formatted_output = []
    
    # 페이지 번호 순으로 정렬
    sorted_toc = sorted(toc_data, key=lambda x: x['page'])
    
    for i in range(len(sorted_toc)):
        current_item = sorted_toc[i]
        start_page = current_item['page']
        title = current_item['title']
        
        # 끝 페이지 계산
        if i < len(sorted_toc) - 1:
            end_page = sorted_toc[i+1]['page'] - 1
        else:
            end_page = start_page + 10 # 기본값 (마지막 챕터)
            
        formatted_output.append({
            "title": title,
            "start_page": start_page,
            "end_page": end_page,
            "range_text": f"{start_page}~{end_page} : {title}"
        })
        
    return formatted_output

def main():
    print(f"Initializing Vertex AI (Project: {PROJECT_ID})...")
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    
    model = GenerativeModel("gemini-2.5-pro")
    
    print(f"Scanning bucket '{BUCKET_NAME}' for TOC files...")
    target_files = get_gcs_pdf_files(BUCKET_NAME)
    
    print(f"Found {len(target_files)} TOC files.")
    
    all_results = {}
    
    for file_uri in target_files:
        toc_data = parse_toc_pdf_from_gcs(file_uri, model)
        if toc_data:
            formatted = format_toc_ranges(toc_data)
            
            # 파일명에서 책 ID 추출 (예: 01_Content.pdf -> 01)
            filename = file_uri.split('/')[-1]
            book_id = filename.split('_')[0]
            
            all_results[book_id] = {
                "filename": filename,
                "gcs_uri": file_uri,
                "toc": formatted
            }
            
            print(f"Successfully processed {filename}. Found {len(formatted)} items.")
            # 콘솔에 일부 출력
            for item in formatted[:3]:
                print(f"  - {item['range_text']}")
            if len(formatted) > 3: print("  - ...")
    
    # 결과 저장
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
        
    print(f"\nProcessing Complete. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
