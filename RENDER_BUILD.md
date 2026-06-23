# Render PDF Server — Build Configuration

## The problem
Render free tier wipes the npm/puppeteer cache between deploys. Chrome downloaded
by `npx puppeteer browsers install chrome` is gone on every restart. This repo now
uses `puppeteer-core` (no bundled Chrome) and installs system Chromium via `apt-get`
in the build command instead — which persists because it goes into the base image.

## Render Dashboard settings for the pdf-server service

### Root Directory
```
server
```

### Build Command
```
apt-get install -y chromium-browser 2>/dev/null || apt-get install -y chromium 2>/dev/null || true && npm install
```

### Start Command
```
node pdf-server.js
```

### Environment Variables (optional — only needed if apt-get path differs)
If `/chrome-check` shows chromium installed at a non-standard path, add:
```
CHROME_PATH = /path/to/chromium
```

## How it works
1. `apt-get install -y chromium-browser` installs Chromium into the Render image.
   The `|| apt-get install -y chromium` fallback handles distros where the package
   name differs. The final `|| true` prevents the build from failing if both fail
   (e.g. on a Docker layer where apt is locked).
2. `npm install` installs `puppeteer-core` + `express` + `cors` with no Chrome download.
3. `pdf-server.js` calls `findChrome()` which walks known system paths:
   - `/usr/bin/chromium-browser`  ← installed by apt-get
   - `/usr/bin/chromium`
   - `/usr/bin/google-chrome-stable`
   - etc.
4. `--disable-dev-shm-usage` is always passed to Puppeteer — critical on Render
   free tier where /dev/shm is only 64MB.

## Verifying after deploy
Visit `https://your-render-url.onrender.com/chrome-check` — you should see:
```json
{
  "resolved_path": "/usr/bin/chromium-browser",
  "resolve_error": null,
  "system_paths": [
    { "path": "/usr/bin/chromium-browser", "exists": true },
    ...
  ]
}
```
