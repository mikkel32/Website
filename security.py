#!/usr/bin/env python3
"""Launch the local website in the default browser."""
import webbrowser
from pathlib import Path

HTML_FILE = Path(__file__).parent / "index.html"

def main():
    if HTML_FILE.exists():
        print("Opening local website:", HTML_FILE.resolve())
        webbrowser.open_new_tab(HTML_FILE.resolve().as_uri())
    else:
        print("Local file not found, opening fallback URL.")
        webbrowser.open_new_tab("https://example.com")

if __name__ == "__main__":
    main()
