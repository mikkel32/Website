#!/usr/bin/env python3
"""Serve the local website over HTTP and open it in the browser."""

from __future__ import annotations

import webbrowser
from contextlib import closing
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import socket
from pathlib import Path
import subprocess

ROOT_DIR = Path(__file__).parent


def compile_scss() -> None:
    """Compile SCSS sources to CSS using the local sass binary."""
    scss = ROOT_DIR / "src" / "styles" / "main.scss"
    css = ROOT_DIR / "main.css"
    try:
        subprocess.run(
            ["npx", "--yes", "sass", scss.as_posix(), css.as_posix()],
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        print("Failed to compile SCSS:", exc)


def _find_free_port(start: int = 8000) -> int:
    """Return an available port on localhost starting from ``start``."""
    port = start
    while True:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            if sock.connect_ex(("localhost", port)) != 0:
                return port
            port += 1


def main() -> None:
    compile_scss()
    port = _find_free_port()
    handler = partial(SimpleHTTPRequestHandler, directory=ROOT_DIR)
    with ThreadingHTTPServer(("localhost", port), handler) as httpd:
        url = f"http://localhost:{port}/"
        print(f"Serving {ROOT_DIR} at {url}")
        webbrowser.open_new_tab(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
