import os
import subprocess
import sys

def main():
    print("==================================================")
    # 1. Install node dependencies if node_modules doesn't exist
    if not os.path.exists("node_modules"):
        print("[Python Boot] Installing Node dependencies...")
        subprocess.run(["npm", "install", "--omit=dev"])
    else:
        print("[Python Boot] node_modules folder detected. Skipping npm install.")

    # 2. Set Express port to 7860 (default Hugging Face port)
    os.environ["PORT"] = "7860"
    print("[Python Boot] Starting Node.js Express server on port 7860...")

    # 3. Start the Node process and pipe output
    try:
        process = subprocess.Popen(
            ["node", "server.js"],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        process.wait()
    except Exception as e:
        print(f"[Python Boot] Error running node server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
