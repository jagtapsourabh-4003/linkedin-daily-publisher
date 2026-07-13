import os
import sys
from huggingface_hub import HfApi

def upload():
    # Retrieve token from arguments or environment
    token = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("HF_TOKEN")
    if not token:
        print("Error: Hugging Face token not provided.")
        sys.exit(1)
        
    repo_id = sys.argv[2] if len(sys.argv) > 2 else "SourabhJagtap/Linkedin"
    print(f"Connecting to Hugging Face Space: {repo_id}...")
    
    try:
        api = HfApi(token=token)
        
        print("Uploading files and folders (excluding node_modules and temp files)...")
        # upload_folder handles binary files and nested directory structures natively
        api.upload_folder(
            folder_path=".",
            repo_id=repo_id,
            repo_type="space",
            ignore_patterns=[
                "node_modules/**",
                ".git/**",
                "project.zip",
                "upload.py",
                "create-zip.ps1",
                ".env",
                "test-*.js",
                ".agents/**"
            ]
        )
        print("\n==================================================")
        print("   SUCCESS: All folders and files uploaded!      ")
        print("==================================================")
    except Exception as e:
        print(f"Error during upload: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    upload()
