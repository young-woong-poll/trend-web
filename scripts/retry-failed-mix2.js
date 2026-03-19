/**
 * contents-mix2.json에서 아직 jjalbang URL인 이미지를 .jpg 확장자로 재시도하는 스크립트
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix2.json');
const API_BASE = 'https://hotpick-api.votebox.kr';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchPage(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

async function extractImageUrl(jjalviewUrl) {
  const html = await fetchPage(jjalviewUrl);
  // 여러 패턴 시도
  const patterns = [
    /id=['"]image_url['"][^>]*src=['"]([^'"]+)['"]/,
    /src=['"]([^'"]+)['"][^>]*id=['"]image_url['"]/,
    /class=['"]view_image['"][^>]*src=['"]([^'"]+)['"]/,
    /src=['"]([^'"]+)['"][^>]*class=['"]view_image['"]/,
    /og:image['"]\s*content=['"]([^'"]+)['"]/,
    /<img[^>]+src=['"]([^'"]*(?:jjalbang|jjalimg)[^'"]*)['"]/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  throw new Error(`이미지 URL을 찾을 수 없습니다: ${jjalviewUrl}`);
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadImage(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`다운로드 실패 (${res.statusCode}): ${url}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || 'image/jpeg';
          resolve({ buffer, contentType });
        });
      })
      .on('error', reject);
  });
}

async function getPresignedUrl(filename) {
  const url = `${API_BASE}/admin/api/v1/storage/presigned?filename=${encodeURIComponent(filename)}`;
  const html = await fetchPage(url);
  const json = JSON.parse(html);
  if (json.code !== 'T0000') {
    throw new Error(`Pre-signed URL 발급 실패: ${json.message}`);
  }
  return { uploadUrl: json.data.uploadUrl, cdnUrl: json.data.cdnUrl };
}

function uploadToS3(buffer, uploadUrl, contentType) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(uploadUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`S3 업로드 실패 (${res.statusCode}): ${data}`));
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function processOneUrl(jjalviewUrl, index, total) {
  try {
    const realImageUrl = await extractImageUrl(jjalviewUrl);
    const { buffer, contentType } = await downloadImage(realImageUrl);

    // 항상 .jpg 확장자로 요청 (GIF/WebP 확장자 우회)
    const filename = `jjal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const { uploadUrl, cdnUrl } = await getPresignedUrl(filename);
    await uploadToS3(buffer, uploadUrl, 'image/jpeg');

    console.log(`[${index + 1}/${total}] OK: ${cdnUrl}`);
    return cdnUrl;
  } catch (err) {
    console.error(`[${index + 1}/${total}] FAIL (${jjalviewUrl}): ${err.message}`);
    return null;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const contents = JSON.parse(fs.readFileSync(CONTENTS_PATH, 'utf-8'));

  const tasks = [];
  for (const item of contents) {
    if (item.type === 'TEXT' && item.image && item.image.includes('jjalbang.today')) {
      tasks.push({ item, field: 'image', url: item.image });
    }
    if (item.type === 'IMAGE' && item.optionImages) {
      item.optionImages.forEach((url, idx) => {
        if (url && url.includes('jjalbang.today')) {
          tasks.push({ item, field: 'optionImages', index: idx, url });
        }
      });
    }
  }

  console.log(`재시도 대상: ${tasks.length}개 이미지\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const cdnUrl = await processOneUrl(task.url, i, tasks.length);

    if (cdnUrl) {
      if (task.field === 'image') task.item.image = cdnUrl;
      else if (task.field === 'optionImages') task.item.optionImages[task.index] = cdnUrl;
      successCount++;
    } else {
      failCount++;
    }

    if (i < tasks.length - 1) await sleep(150);

    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
      console.log(`--- 중간 저장 (${i + 1}/${tasks.length}) ---\n`);
    }
  }

  fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
  console.log(`\n완료! 성공: ${successCount}, 실패: ${failCount}`);
}

main().catch(console.error);
