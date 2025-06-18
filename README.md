# SecureGuard Demo

This project showcases an interactive security themed landing page built with modern web technologies. It relies on ES module scripts and therefore requires running from an HTTP server.

## Running locally

The simplest way to view the site is via the included Python server.
It automatically compiles the SCSS styles to `main.css` on startup.
Compilation uses the Node `sass` binary via `npx` when available and will
attempt to use the Python `sass` package otherwise. If the module is not
installed the server will try to install it with `pip`.

Ensure you have Node.js installed or that `pip` is available so the fallback can
be installed automatically when needed.

```bash
python security.py
```

This starts a local web server and automatically opens the site in your browser. Using a server avoids CORS restrictions that occur when opening `index.html` directly from the file system.

Alternatively you can use the development server provided by Vite (requires Node.js and dependencies):

```bash
npm install
npm run dev
```

## Testing and linting

- `npm test` – run the Jest unit tests
- `npm run lint` – run ESLint and Stylelint

## Project structure

- `main.js` – entry point that initializes all site features
- `src/styles/` – SCSS source styles
- `main.css` – compiled CSS served when running `security.py`
- `security-demo.js` – dynamic demo section with cryptography utilities
- `tests/` – Jest unit tests for utilities and security features


