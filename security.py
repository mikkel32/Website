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
import shutil
import sys

try:
    import sass as pysass  # type: ignore
except Exception:  # ImportError or other issues
    pysass = None

ROOT_DIR = Path(__file__).parent

def _install_python_sass() -> bool:
    """Attempt to install the python ``sass`` module via pip without building."""
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--user",
                "--only-binary",
                ":all:",
                "sass",
            ],
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, OSError) as exc:
        print("Failed to auto-install python sass module:", exc)
        return False


def compile_scss() -> None:
    """Compile SCSS sources to CSS using either Node or the Python sass lib."""
    scss = ROOT_DIR / "src" / "styles" / "main.scss"
    css = ROOT_DIR / "main.css"

    npx_cmd = shutil.which("npx") or shutil.which("npx.cmd")
    if npx_cmd:
        try:
            subprocess.run(
                [npx_cmd, "--yes", "sass", scss.as_posix(), css.as_posix()],
                check=True,
            )
            return
        except subprocess.CalledProcessError as exc:
            print("Failed to compile SCSS with npx:", exc)
    else:
        print("npx not found; attempting to use python sass module")

    if pysass is None:
        if _install_python_sass():
            try:
                import sass as pysass_installed  # type: ignore
                globals()["pysass"] = pysass_installed
            except Exception as exc:  # pylint: disable=broad-except
                print("Failed to import python sass after install:", exc)
    if pysass is not None:
        try:
            css.write_text(pysass.compile(filename=scss.as_posix()))
            return
        except Exception as exc:  # pylint: disable=broad-except
            print("Failed to compile SCSS with python sass:", exc)

    if npx_cmd is None and pysass is None:
        print(
            "Failed to compile SCSS: Node.js with npx was not found and the \"
            "sass\" Python package is unavailable. Install Node.js from "
            "https://nodejs.org/ or manually install a prebuilt \"sass\" wheel."
        )


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
