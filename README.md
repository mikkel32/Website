# SecureGuard Demo

This project showcases an interactive security themed landing page built with modern web technologies. It relies on ES module scripts and therefore requires running from an HTTP server.

## Running locally

The simplest way to view the site is via the included Python server.
It automatically compiles the SCSS styles to `main.css` on startup.
Compilation uses the Node `sass` binary via `npx` when available and will
fall back to the Python `sass` package when `npx` cannot be found. If the module
is not installed the server will attempt to install it with `pip`.
After the SCSS is compiled, the resulting CSS is automatically processed
with PostCSS using the included configuration. This adds vendor prefixes via
Autoprefixer so the styles work consistently across browsers.

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
npm install   # install dependencies such as Anime.js, fonts and icons
npm run update-anime   # fetch the bundled Anime.js fallback (optional version)
python security.py
```

Run `npm install` before any `npm test` or `python security.py` command to
ensure all dependencies are available.

If dependencies are missing, scripts like the hero animations may fail to load
or styles may not find the Poppins font and Font Awesome icons
(resulting in 404 errors for files under `node_modules`). The `security.py`
server automatically attempts to run `npm install` when these packages are not
found. Running `npm install` manually beforehand is still recommended to speed
up startup and ensure the necessary modules are available when the page loads.

This starts a local web server and automatically opens the site in your browser. Using a server avoids CORS restrictions that occur when opening `index.html` directly from the file system. Running `npm install` ensures the required modules are available when the page loads.

The development server also sends a strict Content Security Policy and
`Strict-Transport-Security` header. Inline scripts and styles are blocked, so
all code is loaded from external files. This mirrors a hardened production setup
and helps catch policy violations during development.

## Overriding the Content Security Policy

The server looks for a `CONTENT_SECURITY_POLICY` environment variable and uses
its value as the policy template. A `{nonce}` placeholder will automatically be
replaced with a unique per-request nonce. This makes it possible to allow
specific inline scripts while keeping the policy strict.

```bash
CONTENT_SECURITY_POLICY="default-src 'self'; img-src 'self' https://images.unsplash.com data:; script-src 'self' 'blob:' https://cdn.jsdelivr.net {nonce}; style-src 'self'" python security.py
```

The example above permits images from Unsplash and scripts from jsdelivr while
retaining `default-src 'self'` for all other resources.

## Rate limiting

`security.py` includes a lightweight rate limiter that counts requests per IP
address. When a client exceeds the allowed number of requests within the
configured time window, the server responds with **HTTP 429 Too Many Requests**.

The defaults allow **20** requests every **1** second. You can adjust these
limits by setting the environment variables `MAX_REQUESTS` and `RATE_WINDOW`:

```bash
MAX_REQUESTS=10 RATE_WINDOW=2 python security.py
```

The example above permits ten requests from the same IP within a two second
window before subsequent requests are rejected. The `Retry-After` header of the
response indicates how long clients should wait before retrying.

The default Content Security Policy now includes `img-src 'self' data: https://images.unsplash.com` so that
local images, data URIs, and the Unsplash images used in the demo load without triggering browser CSP errors.
It further sets `connect-src 'self' https://cdn.jsdelivr.net` so that runtime
`fetch` requests to jsDelivr succeed when loading bundled modules.

Alternatively you can use the development server provided by Vite (requires Node.js and dependencies):

```bash
npm install
npm run dev
```

## Testing and linting

- `npm test` – run the Jest unit tests
- `npm run lint` – run ESLint and Stylelint
- `npm run audit` – check dependencies for vulnerabilities (fails on high severity)
- Ensure dependencies are installed with `npm install` before running these commands.

## Project structure

- `main.js` – entry point that initializes all site features
- `src/styles/` – SCSS source styles
- `main.css` – compiled CSS served when running `security.py`
- `security-demo.js` – dynamic demo section with cryptography utilities such as
  AES encryption, hashing, and HMAC generation
- `parallax.js` – scroll-based parallax effect for the hero background that
  disables itself when `prefers-reduced-motion` is enabled
- `tests/` – Jest unit tests for utilities and security features

## Diagnostics dashboard

The optional `dashboard.html` page visualizes logs captured by
`error-capture.js`. Console errors, warnings and fetch requests are stored in
`localStorage` under the `sgLogs` key. Resource loading issues such as failed
images or scripts are also tracked by listening for window `'error'` events in
the capturing phase. When a resource fails to load a log entry is created with a
message like:

```
Resource failed to load: <URL>
```

Opening the dashboard page will display these entries alongside other logs.

The dashboard listens for custom `sg:log` and `sg:fetch` events dispatched by
`error-capture.js`. This decouples the UI from the capture logic and allows
other parts of the app to stream logs in real-time. The page provides global
controls to collapse or expand all panels and uses `localStorage` to persist
panel state and captured logs between visits.

Chart.js powering the network activity visualization is loaded on demand when the dashboard initializes, reducing the amount of JavaScript downloaded on first load. The loader now tries the locally installed module first, then a bundled copy at `dashboard/chart.bundle.mjs` (mirrored under `public/dashboard` for production builds), and finally falls back to a version from [esm.sh](https://esm.sh/) if those fail. This guarantees the chart loads even when dependency resolution or network access break down.

Run `npm run update-chart` anytime you want to refresh the bundled file with the latest Chart.js version. The script uses `curl` to download `?bundle` from esm.sh and writes it to both `dashboard/chart.bundle.mjs` and `public/dashboard/chart.bundle.mjs`.

Run `npm run update-anime` to refresh the bundled Anime.js file used as a fallback by the hero animations. Pass a version number to retrieve that release, e.g. `npm run update-anime 4.0.2`. The script downloads the chosen version from jsDelivr and writes it to `anime.bundle.mjs` and `public/anime.bundle.mjs`.



## Security auditing

A GitHub Actions workflow automatically runs `npm audit` on every push and pull request. The build fails if any high-severity vulnerabilities are found. You can run the same check locally with `npm run audit`.

## Automated pull request merging

Another workflow merges pull requests once all checks succeed using the Node script `.github/scripts/auto-merge.js`. The workflow sets up Node with `actions/setup-node` and then runs the script with the provided GitHub token. If the PR cannot be merged, the script posts a comment explaining why and marks the job as failed.

