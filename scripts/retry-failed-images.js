/**
 * 실패한 짤뱅 이미지(GIF)를 .jpg 확장자로 presigned URL 요청하여 재업로드하는 스크립트
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix.json');
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
  const match = html.match(/id=['"]image_url['"][^>]*src=['"]([^'"]+)['"]/);
  if (!match) {
    const match2 = html.match(/src=['"]([^'"]+)['"][^>]*id=['"]image_url['"]/);
    if (!match2) {
      throw new Error(`이미지 URL을 찾을 수 없습니다: ${jjalviewUrl}`);
    }
    return match2[1];
  }
  return match[1];
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
          const contentType = res.headers['content-type'] || 'image/gif';
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`S3 업로드 실패 (${res.statusCode}): ${data}`));
        }
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

    // 핵심 변경: 확장자를 항상 .jpg로 설정하여 presigned URL 발급
    // GIF/WebP 등 지원하지 않는 확장자 우회
    const filename = `jjal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    const { uploadUrl, cdnUrl } = await getPresignedUrl(filename);

    // presigned URL은 .jpg로 발급받았으므로 content-type도 image/jpeg로 맞춤
    // (S3 presigned URL 서명에 content-type이 포함되어 있어 일치해야 함)
    await uploadToS3(buffer, uploadUrl, 'image/jpeg');

    console.log(`[${index + 1}/${total}] OK: ${cdnUrl} (원본: ${realImageUrl.split('/').pop()})`);
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

  // 아직 jjalbang URL인 것만 수집
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
      if (task.field === 'image') {
        task.item.image = cdnUrl;
      } else if (task.field === 'optionImages') {
        task.item.optionImages[task.index] = cdnUrl;
      }
      successCount++;
    } else {
      failCount++;
    }

    if (i < tasks.length - 1) {
      await sleep(150);
    }

    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
      console.log(`--- 중간 저장 (${i + 1}/${tasks.length}) ---\n`);
    }
  }

  fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
  console.log(`\n완료! 성공: ${successCount}, 실패: ${failCount}`);
}

main().catch(console.error);
