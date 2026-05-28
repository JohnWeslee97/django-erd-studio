import os
import sys
import threading
import webbrowser
import time
from pathlib import Path

def find_manage_py(start_path):
    """Walks up from start_path to find manage.py."""
    curr = Path(start_path).resolve()
    for _ in range(10):  # Limit recursion to 10 levels
        if (curr / "manage.py").exists():
            return curr
        if curr.parent == curr:
            break
        curr = curr.parent
    return None

def start_browser(port):
    """Timer callback to open browser."""
    url = f"http://127.0.0.1:{port}"
    print(f"[*] Opening browser: {url}")
    webbrowser.open(url)

def main():
    # 1. Find project root
    project_root = find_manage_py(os.getcwd())
    if not project_root:
        print("[!] Error: Could not find manage.py in any parent directory.")
        print("Please run this command from inside your Django project.")
        sys.exit(1)

    # 2. Add to sys.path
    sys.path.insert(0, str(project_root))

    # 3. Handle Settings
    settings_module = os.environ.get("DJANGO_SETTINGS_MODULE")
    if not settings_module:
        print("[?] DJANGO_SETTINGS_MODULE not found in environment.")
        # Try to guess from manage.py content or ask
        # For simplicity in this CLI, we ask the user
        settings_module = input("Enter your settings module (e.g. myproject.settings): ").strip()
        if not settings_module:
            print("[!] Error: Settings module is required.")
            sys.exit(1)
        os.environ["DJANGO_SETTINGS_MODULE"] = settings_module

    # 4. Setup Django (only if not already setup)
    from django.apps import apps
    if not apps.ready:
        try:
            import django
            django.setup()
            print("[+] Django initialized successfully.")
        except Exception as e:
            # If still not set, and not in interactive mode, this might fail
            if not os.environ.get("DJANGO_SETTINGS_MODULE"):
                print("[!] Error: DJANGO_SETTINGS_MODULE not set.")
                sys.exit(1)
            print(f"[!] Error: Django setup failed. {e}")
            sys.exit(1)
    else:
        print("[+] Django already initialized (running as command).")

    # 5. Start Browser Timer (1.3s delay)
    port = 8765
    threading.Timer(1.3, start_browser, args=(port,)).start()

    # 6. Start Server
    from .server import run_server
    try:
        run_server(port=port)
    except KeyboardInterrupt:
        print("\n[*] Shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()
