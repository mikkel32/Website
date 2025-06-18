#!/usr/bin/env python3
"""Serve the local website over HTTP and open it in the browser."""

from __future__ import annotations

import webbrowser
from contextlib import closing
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import socket
import os

import time
from pathlib import Path
import subprocess
import shutil
import sys
import urllib.parse
import json
import html
import re
from secrets import token_urlsafe

try:
    import sass as pysass  # type: ignore
except Exception:  # ImportError or other issues
    pysass = None

ROOT_DIR = Path(__file__).parent

CSRF_TOKENS: dict[str, float] = {}
TOKEN_TTL = 600  # seconds
PATTERNS = [
    re.compile(r"<script", re.I),
    re.compile(r"select\b.*from", re.I),
    re.compile(r"(\bor\b|\band\b).*=.*\b", re.I),
    re.compile(r"drop\s+table", re.I),
    re.compile(r"insert\s+into", re.I),
    re.compile(r"delete\s+from", re.I),
    re.compile(r"update\s+\w+\s+set", re.I),
    re.compile(r"onerror\s*=", re.I),
    re.compile(r"javascript:", re.I),
]


def generate_csrf_token() -> str:
    token = token_urlsafe(16)
    CSRF_TOKENS[token] = time.time() + TOKEN_TTL
    return token


def verify_csrf_token(token: str) -> bool:
    expiry = CSRF_TOKENS.pop(token, None)
    return bool(expiry and expiry > time.time())


def sanitize_text(text: str) -> str:
    if any(p.search(text) for p in PATTERNS):
        raise ValueError("malicious input")
    return html.escape(text, quote=True)


class RateLimiter:
    """Track simple request counts per IP within a fixed time window."""

    def __init__(self, limit: int, window: int) -> None:
        self.limit = limit
        self.window = window
        self._counters: dict[str, tuple[int, float]] = {}

    def exceeded(self, ip: str) -> bool:
        now = time.time()
        count, start = self._counters.get(ip, (0, now))
        if now - start > self.window:
            count, start = 0, now
        count += 1
        self._counters[ip] = (count, start)
        return count > self.limit


class SecureHandler(SimpleHTTPRequestHandler):
    """HTTP handler that injects security headers for every response."""

    rate_limiter = RateLimiter(
        int(os.environ.get("MAX_REQUESTS", "5")),
        int(os.environ.get("RATE_WINDOW", "1")),
    )

    # Content Security Policy template used for every response. Include a
    # ``{nonce}`` placeholder to automatically inject a per-request nonce.
    csp_template = os.environ.get(
        "CONTENT_SECURITY_POLICY",
        "default-src 'self'; img-src 'self' data:; script-src 'self' {nonce}; style-src 'self'",
    )

    def end_headers(self) -> None:  # type: ignore[override]
        nonce_value = token_urlsafe(16)
        csp_header = self.csp_template
        if "{nonce}" in csp_header:
            csp_header = csp_header.replace("{nonce}", f"'nonce-{nonce_value}'")
        self.send_header("Content-Security-Policy", csp_header)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header(
            "Strict-Transport-Security",
            "max-age=63072000; includeSubDomains; preload",
        )
        self.send_header("Permissions-Policy", "geolocation=()")
        self.send_header("X-XSS-Protection", "1; mode=block")
        super().end_headers()

    def _check_rate_limit(self) -> bool:
        if self.rate_limiter.exceeded(self.client_address[0]):
            self.send_response(429)
            self.send_header("Retry-After", str(self.rate_limiter.window))
            self.end_headers()
            self.wfile.write(b"Too Many Requests")
            return True
        return False

    def do_GET(self) -> None:  # type: ignore[override]
        if self._check_rate_limit():
            return
        if self.path == "/csrf-token":
            token = generate_csrf_token()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"token": token}).encode())
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # type: ignore[override]
        if self._check_rate_limit():
            return
        super().do_HEAD()

    def do_POST(self) -> None:  # type: ignore[override]
        if self._check_rate_limit():
            return
        if self.path != "/contact":
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(length).decode("utf-8") if length else ""
        ctype = self.headers.get("Content-Type", "")
        if "application/json" in ctype:
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid JSON")
                return
        else:
            params = urllib.parse.parse_qs(data)
            payload = {k: v[0] if isinstance(v, list) else v for k, v in params.items()}

        token = payload.get("csrf_token", "")
        if not token or not verify_csrf_token(token):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Invalid CSRF token")
            return

        try:
            sanitize_text(str(payload.get("name", "")))
            sanitize_text(str(payload.get("email", "")))
            sanitize_text(str(payload.get("message", "")))
        except ValueError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Malicious input")
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')


def _ensure_node_deps() -> None:
    """Install Node dependencies if ``animejs`` is missing."""
    anime_path = ROOT_DIR / "node_modules" / "animejs" / "lib" / "anime.esm.js"
    if anime_path.exists():
        return

    npm_cmd = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_cmd:
        print(
            "Anime.js dependency missing and npm not found. "
            "Install Node.js and run 'npm install' manually."
        )
        return

    print("Node dependencies missing; running 'npm install'...")
    try:
        subprocess.run([npm_cmd, "install"], check=True, cwd=ROOT_DIR)
    except subprocess.CalledProcessError as exc:
        print("Failed to install npm dependencies:", exc)

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


def _run_postcss(css: Path) -> bool:
    """Run PostCSS on the given CSS file if ``npx`` is available."""
    npx_cmd = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx_cmd:
        print("npx not found; skipping PostCSS step")
        return False
    try:
        subprocess.run(
            [npx_cmd, "--yes", "postcss", css.as_posix(), "-o", css.as_posix()],
            check=True,
        )
        return True
    except subprocess.CalledProcessError as exc:
        print("Failed to run PostCSS:", exc)
        return False


def compile_scss() -> None:
    """Compile SCSS sources to CSS using either Node or the Python sass lib."""
    scss = ROOT_DIR / "src" / "styles" / "main.scss"
    css = ROOT_DIR / "main.css"
    dash_scss = ROOT_DIR / "src" / "styles" / "dashboard.scss"
    dash_css = ROOT_DIR / "dashboard" / "dashboard.css"

    npx_cmd = shutil.which("npx") or shutil.which("npx.cmd")
    if npx_cmd:
        try:
            subprocess.run(
                [npx_cmd, "--yes", "sass", scss.as_posix(), css.as_posix()],
                check=True,
            )
            subprocess.run(
                [npx_cmd, "--yes", "sass", dash_scss.as_posix(), dash_css.as_posix()],
                check=True,
            )
            _run_postcss(css)
            _run_postcss(dash_css)
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
            dash_css.write_text(pysass.compile(filename=dash_scss.as_posix()))
            _run_postcss(css)
            _run_postcss(dash_css)
            return
        except Exception as exc:  # pylint: disable=broad-except
            print("Failed to compile SCSS with python sass:", exc)

    if npx_cmd is None and pysass is None:
        print(
            "Failed to compile SCSS: Node.js with npx was not found and the "
            '"sass" Python package is unavailable. Install Node.js from '
            'https://nodejs.org/ or manually install a prebuilt "sass" wheel.'
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
    _ensure_node_deps()
    compile_scss()
    limit = int(os.environ.get("MAX_REQUESTS", "5"))
    window = int(os.environ.get("RATE_WINDOW", "1"))
    SecureHandler.rate_limiter = RateLimiter(limit, window)
    port = int(os.environ.get("PORT", _find_free_port()))
    handler = partial(SecureHandler, directory=ROOT_DIR)
    with ThreadingHTTPServer(("localhost", port), handler) as httpd:
        url = f"http://localhost:{port}/"
        print(f"Serving {ROOT_DIR} at {url}")
        if os.environ.get("NO_BROWSER") != "1":
            webbrowser.open_new_tab(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
