# Render PDF Server Setup

## Render settings

Root Directory:

server

Build Command:

npm install

Start Command:

node pdf-server.js

## How it works

The server uses Puppeteer.

Puppeteer automatically downloads and manages Chromium during npm install.

No:

- apt-get
- chromium install
- CHROME_PATH
- puppeteer-core

is required.

## Verify

Open:

/health

Expected:

{
"ok": true
}

```

```
