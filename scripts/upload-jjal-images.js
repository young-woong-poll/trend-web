/**
 * 짤뱅 이미지를 다운받아 S3에 업로드하고 contents-mix.json의 URL을 CDN URL로 교체하는 스크립트
 *
 * 사용법: node scripts/upload-jjal-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix.json');
const API_BASE = 'https://hotpick-api.votebox.kr';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ============================
// 1. 짤뱅 페이지에서 실제 이미지 URL 추출
// ============================
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
  // id='image_url' 인 img 태그의 src 추출
  const match = html.match(/id=['"]image_url['"][^>]*src=['"]([^'"]+)['"]/);
  if (!match) {
    // 다른 패턴 시도: src가 먼저 나오는 경우
    const match2 = html.match(/src=['"]([^'"]+)['"][^>]*id=['"]image_url['"]/);
    if (!match2) {
      throw new Error(`이미지 URL을 찾을 수 없습니다: ${jjalviewUrl}`);
    }
    return match2[1];
  }
  return match[1];
}

// ============================
// 2. 이미지 다운로드 (Buffer로)
// ============================
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

// ============================
// 3. S3 Pre-signed URL 발급
// ============================
async function getPresignedUrl(filename) {
  const url = `${API_BASE}/admin/api/v1/storage/presigned?filename=${encodeURIComponent(filename)}`;
  const html = await fetchPage(url);
  const json = JSON.parse(html);
  if (json.code !== 'T0000') {
    throw new Error(`Pre-signed URL 발급 실패: ${json.message}`);
  }
  return { uploadUrl: json.data.uploadUrl, cdnUrl: json.data.cdnUrl };
}

// ============================
// 4. S3에 업로드
// ============================
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

// ============================
// 5. 전체 처리 파이프라인
// ============================
async function processOneUrl(jjalviewUrl, index, total) {
  try {
    // 1) 실제 이미지 URL 추출
    const realImageUrl = await extractImageUrl(jjalviewUrl);

    // 2) 이미지 다운로드
    const { buffer, contentType } = await downloadImage(realImageUrl);

    // 3) 파일 확장자 결정
    const ext = contentType.includes('gif')
      ? 'gif'
      : contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : 'jpg';
    const filename = `jjal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 4) Pre-signed URL 발급
    const { uploadUrl, cdnUrl } = await getPresignedUrl(filename);

    // 5) S3 업로드
    await uploadToS3(buffer, uploadUrl, contentType);

    console.log(`[${index + 1}/${total}] OK: ${cdnUrl}`);
    return cdnUrl;
  } catch (err) {
    console.error(`[${index + 1}/${total}] FAIL (${jjalviewUrl}): ${err.message}`);
    return null; // 실패 시 원본 URL 유지
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const contents = JSON.parse(fs.readFileSync(CONTENTS_PATH, 'utf-8'));

  // 모든 짤뱅 URL 수집
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

  console.log(`총 ${tasks.length}개 이미지 처리 시작\n`);

  // 순차 처리 (API rate limit 고려)
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

    // Rate limit 방지 (100ms 간격)
    if (i < tasks.length - 1) {
      await sleep(100);
    }

    // 10개마다 중간 저장
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
      console.log(`--- 중간 저장 (${i + 1}/${tasks.length}) ---\n`);
    }
  }

  // 최종 저장
  fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
  console.log(`\n완료! 성공: ${successCount}, 실패: ${failCount}`);
  console.log(`저장됨: ${CONTENTS_PATH}`);
}

main().catch(console.error);
