/**
 * pdf-server.js
 *
 * Express PDF generation server
 * Uses puppeteer + chrome-headless-shell installed on Render
 */

import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import { existsSync, readdirSync } from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Find Puppeteer downloaded Chrome Headless Shell
function getChromePath() {
  const base = "/opt/render/.cache/puppeteer/chrome-headless-shell";
  if (!existsSync(base)) {
    console.log("[pdf-server] chrome cache folder missing:", base);
    return null;
  }
  const folders = readdirSync(base);
  if (!folders.length) {
    console.log("[pdf-server] no chrome folders found");
    return null;
  }
  const chromePath = path.join(
    base,
    folders[0],
    "chrome-headless-shell-linux64",
    "chrome-headless-shell"
  );
  console.log("[pdf-server] checking chrome:", chromePath);
  if (existsSync(chromePath)) {
    console.log("[pdf-server] chrome found");
    return chromePath;
  }
  console.log("[pdf-server] chrome executable missing");
  return null;
}

app.post("/generate-pdf", async (req, res) => {
  const { html, filename = "document.pdf" } = req.body ?? {};
  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "Missing html" });
  }

  let browser;
  try {
    const chromePath = getChromePath();
    console.log("[pdf-server] launching browser:", chromePath);
    browser = await puppeteer.launch({
      executablePath: chromePath || undefined,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    await page.evaluate(() => {
      document.documentElement.style.setProperty("background-color", "#f7f5f0", "important");
      document.documentElement.style.setProperty("-webkit-print-color-adjust", "exact", "important");
      document.documentElement.style.setProperty("print-color-adjust", "exact", "important");
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "18mm",
        bottom: "22mm",
        left: "0",
        right: "0"
      },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="
          width:100%;
          font-family:Arial;
          font-size:11px;
          color:#c8963e;
          padding:0 15mm;
          display:flex;
          justify-content:space-between;
        ">
        <span>Aurevon Studios — Confidential</span>
        <span>
        Page
        <span class="pageNumber"></span>
        of
        <span class="totalPages"></span>
        </span>
        </div>
        `
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error("[pdf-server] PDF error:", err);
    res.status(500).json({
      error: "PDF generation failed",
      detail: err.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    chrome: getChromePath()
  });
});

app.listen(PORT, () => {
  console.log(`✅ pdf-server running on port ${PORT}`);
});