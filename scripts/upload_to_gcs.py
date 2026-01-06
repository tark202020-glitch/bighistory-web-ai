
from google.cloud import storage
import os
import sys

# 설정
PROJECT_ID = "rag-bighistory"  # GCP 프로젝트 ID
BUCKET_NAME = "20set-bighistory-raw" # 기존 버킷 사용
SOURCE_DIR = "temp_images"
DESTINATION_FOLDER = "extracted_images/" # 버킷 내 저장 폴더

def upload_directory_to_gcs(bucket_name, source_directory, destination_blob_folder):
    """
    로컬 폴더의 모든 파일을 GCS 버킷의 특정 폴더로 업로드합니다.
    """
    try:
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # 1. 기존 파일 삭제 (Clean Upload)
        blobs = list(bucket.list_blobs(prefix=destination_blob_folder))
        if blobs:
            print(f"Cleaning up {len(blobs)} existing files in 'gs://{bucket_name}/{destination_blob_folder}'...")
            for blob in blobs:
                blob.delete()
            print("Cleanup complete.")

        files = os.listdir(source_directory)
        print(f"Found {len(files)} files in '{source_directory}'. Uploading to gs://{bucket_name}/{destination_blob_folder}...")

        count = 0
        for filename in files:
            local_path = os.path.join(source_directory, filename)
            
            # 파일만 업로드
            if os.path.isfile(local_path):
                # .DS_Store 등 시스템 파일 제외
                if filename.startswith("."):
                    continue
                    
                blob_path = f"{destination_blob_folder}{filename}"
                blob = bucket.blob(blob_path)
                
                # 이미 존재하는지 체크 (선택 사항: 덮어쓰기 방지하려면 사용)
                # if blob.exists():
                #     print(f"Skipping {filename} (already exists)")
                #     continue
                
                blob.upload_from_filename(local_path)
                count += 1
                if count % 10 == 0:
                    print(f"Uploaded {count} files...")

        print(f"Upload Complete! Total {count} files uploaded.")
        print(f"Sample URL: gs://{bucket_name}/{destination_blob_folder}{files[0] if files else ''}")
        
    except Exception as e:
        print(f"Error checking GCS: {e}")

if __name__ == "__main__":
    if os.path.exists(SOURCE_DIR):
        upload_directory_to_gcs(BUCKET_NAME, SOURCE_DIR, DESTINATION_FOLDER)
    else:
        print(f"Source directory '{SOURCE_DIR}' not found. Run extract_images.py first.")
