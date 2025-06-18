# SecureGuard Demo

This project showcases an interactive security themed landing page built with modern web technologies. It relies on ES module scripts and therefore requires running from an HTTP server.

## Running locally

The simplest way to view the site is via the included Python server.
It automatically compiles the SCSS styles to `main.css` on startup.
Compilation uses the Node `sass` binary via `npx` when available and will
fall back to the Python `sass` package when `npx` cannot be found. If the module
is not installed the server will attempt to install it with `pip`.

**Node.js is strongly recommended.** The Python fallback requires a working C/C++
compiler and may fail on some platforms (for example Python 3.13 on Windows does
not currently have prebuilt wheels). Installing [Node.js](https://nodejs.org)
ensures SCSS compilation works out of the box. After installing Node.js,
install the `sass` compiler globally so the server can compile SCSS without
falling back to Python:

```bash
npm install -g sass
```

```bash
npm install   # install dependencies such as Anime.js
python security.py
```

If dependencies are missing, scripts like the hero animations may fail to load
(resulting in 404 errors for files under `node_modules`). Running `npm install`
ensures the necessary modules are available when the page loads.

This starts a local web server and automatically opens the site in your browser. Using a server avoids CORS restrictions that occur when opening `index.html` directly from the file system. Running `npm install` ensures the required modules are available when the page loads.

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


