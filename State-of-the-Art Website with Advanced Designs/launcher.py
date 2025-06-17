import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

PROJECT_DIR = Path(__file__).parent


def install_dependencies():
    req = PROJECT_DIR / 'requirements.txt'
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', str(req)])


def start_backend():
    return subprocess.Popen([sys.executable, 'app.py'], cwd=PROJECT_DIR)


def start_frontend():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', '8000'], cwd=PROJECT_DIR)

    def _open():
        time.sleep(2)
        webbrowser.open('http://localhost:8000/index.html')

    threading.Thread(target=_open, daemon=True).start()
    return server


def main():
    install_dependencies()
    backend = start_backend()
    frontend = start_frontend()
    try:
        backend.wait()
    finally:
        frontend.terminate()
        backend.terminate()


if __name__ == '__main__':
    main()
