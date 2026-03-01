const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CARDS_DIR = path.join(__dirname, 'insta-cards');
const IMAGES_DIR = path.join(__dirname, 'images');
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PORT = 8765;

async function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(PROJECT_ROOT, decodeURIComponent(req.url));
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      resolve(server);
    });
  });
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
  });
  const page = await context.newPage();

  const htmlFiles = fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => !f.startsWith('001-')) // Skip id:1 (already generated)
    .sort();

  console.log(`Processing ${htmlFiles.length} files...`);

  for (let i = 0; i < htmlFiles.length; i++) {
    const htmlFile = htmlFiles[i];
    const pngFile = htmlFile.replace('.html', '.png');
    const url = `http://localhost:${PORT}/docs/contents/insta-cards/${htmlFile}`;

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(IMAGES_DIR, pngFile),
        type: 'png',
      });

      console.log(`[${i + 1}/${htmlFiles.length}] ${pngFile}`);
    } catch (err) {
      console.error(`[${i + 1}/${htmlFiles.length}] FAILED ${htmlFile}: ${err.message}`);
    }
  }

  await browser.close();
  server.close();
  console.log(`\nDone! Screenshots saved to ${IMAGES_DIR}`);
}

main().catch(console.error);
