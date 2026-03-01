const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'contents-mix.json'), 'utf-8'));
const outDir = path.join(__dirname, 'insta-cards');
fs.mkdirSync(outDir, { recursive: true });

const FONT_CSS = `
  @font-face {
    font-family: 'Maplestory';
    src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: block;
  }
  @font-face {
    font-family: 'Maplestory';
    src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Light.woff2') format('woff2');
    font-weight: 300;
    font-display: block;
  }
`;

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1080px;
    height: 1350px;
    background: #FFFFFF;
    color: #111;
    font-family: 'Maplestory', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 52px 52px 40px;
  }

  .title {
    font-size: 76px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 28px;
    word-break: keep-all;
  }

  .title.long {
    font-size: 64px;
  }

  .image-area {
    width: 100%;
    height: 540px;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 28px;
    border: 2px solid #E0E0E0;
    flex-shrink: 0;
  }

  .image-area img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #F0F0F0;
  }

  .story-box {
    background: #F5F5F5;
    border-radius: 14px;
    padding: 24px 28px;
    margin-bottom: 32px;
  }

  .story-label {
    font-size: 26px;
    font-weight: 700;
    color: #999;
    margin-bottom: 8px;
  }

  .story-text {
    font-size: 34px;
    font-weight: 300;
    color: #555;
    line-height: 1.55;
    word-break: keep-all;
  }

  .options {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .option {
    font-size: 52px;
    font-weight: 300;
  }

  .vs {
    font-size: 34px;
    font-weight: 300;
    color: #999;
  }

  .options-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .option-item {
    font-size: 48px;
    font-weight: 700;
    text-align: center;
  }

  .image-options {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }

  .image-option {
    flex: 1;
    height: 400px;
    position: relative;
    border-radius: 14px;
    overflow: hidden;
  }

  .image-option img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%);
  }

  .image-label {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 42px;
    font-weight: 700;
    color: #fff;
    z-index: 2;
  }

  .image-vs {
    font-size: 34px;
    font-weight: 300;
    color: #999;
    flex-shrink: 0;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #E0E0E0;
    margin-top: auto;
  }

  .logo img {
    height: 48px;
    width: auto;
  }
`;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isLongTitle(title) {
  // 3줄 이상이면 long 클래스 적용 (약 15자 이상이면 2줄, 30자 이상이면 3줄+)
  return title.length > 20;
}

function buildOptionsHtml(item) {
  const opts = item.options;
  const type = item.type;

  // IMAGE 타입: 이미지 분할형
  if (type === 'IMAGE' && item.optionImages && item.optionImages.length >= 2) {
    return `
      <div class="image-options">
        <div class="image-option">
          <img src="${escapeHtml(item.optionImages[0])}" alt="">
          <div class="image-overlay"></div>
          <span class="image-label">${escapeHtml(opts[0])}</span>
        </div>
        <div class="image-vs">vs</div>
        <div class="image-option">
          <img src="${escapeHtml(item.optionImages[1])}" alt="">
          <div class="image-overlay"></div>
          <span class="image-label">${escapeHtml(opts[1])}</span>
        </div>
      </div>`;
  }

  // TEXT + 2개 옵션: 가로 vs
  if (opts.length === 2) {
    return `
      <div class="options">
        <div class="option">${escapeHtml(opts[0])}</div>
        <div class="vs">vs</div>
        <div class="option">${escapeHtml(opts[1])}</div>
      </div>`;
  }

  // TEXT + 3개 이상: 세로 리스트
  const items = opts
    .map((o) => `        <div class="option-item">${escapeHtml(o)}</div>`)
    .join('\n');
  return `
      <div class="options-list">
${items}
      </div>`;
}

function buildImageAreaHtml(item) {
  // IMAGE 타입은 짤 이미지 영역 제거
  if (item.type === 'IMAGE') return '';
  if (!item.image) return '';
  return `
      <div class="image-area">
        <img src="${escapeHtml(item.image)}" alt="">
      </div>`;
}

function buildStoryHtml(item) {
  if (!item.story) return '';
  return `
      <div class="story-box">
        <div class="story-label">사연</div>
        <p class="story-text">${escapeHtml(item.story)}</p>
      </div>`;
}

function generateHtml(item) {
  const titleClass = isLongTitle(item.title) ? ' long' : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
${FONT_CSS}
${BASE_CSS}
</style>
</head>
<body>
<div class="content">
  <h1 class="title${titleClass}">${escapeHtml(item.title)}</h1>${buildImageAreaHtml(item)}${buildStoryHtml(item)}${buildOptionsHtml(item)}
  <div class="footer">
    <div class="logo">
      <img src="../../../public/main-logo.png" alt="HotPick">
    </div>
  </div>
</div>
</body>
</html>
`;
}

let count = 0;
for (const item of data) {
  if (item.id < 2) continue;
  const padId = String(item.id).padStart(3, '0');
  const filename = `${padId}-${item.slug}.html`;
  const html = generateHtml(item);
  fs.writeFileSync(path.join(outDir, filename), html, 'utf-8');
  count++;
}

console.log(`Generated ${count} HTML files in ${outDir}`);
