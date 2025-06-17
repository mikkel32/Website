#!/usr/bin/env python3
"""Open the included website in the default browser."""
import webbrowser
from pathlib import Path

HTML_FILE = Path(__file__).parent / 'index.html'

def main():
    if HTML_FILE.exists():
        webbrowser.open(HTML_FILE.as_uri())
    else:
        webbrowser.open('https://example.com')

if __name__ == '__main__':
    main()
