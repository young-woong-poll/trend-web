/**
 * OG 이미지를 S3에 업로드하는 스크립트
 *
 * 사용법: node scripts/upload-og-image.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = 'https://hotpick-api.votebox.kr';
const FILE_PATH = path.join(__dirname, '../public/main-og2.png');
const UPLOAD_NAME = 'og-hotpick.png';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

async function getPresignedUrl(filename) {
  const url = `${API_BASE}/admin/api/v1/storage/presigned?filename=${encodeURIComponent(filename)}`;
  const body = await httpsGet(url);
  const json = JSON.parse(body);
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
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`S3 업로드 실패: ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function main() {
  console.log(`파일 읽기: ${FILE_PATH}`);
  const buffer = fs.readFileSync(FILE_PATH);
  console.log(`파일 크기: ${(buffer.length / 1024).toFixed(1)}KB`);

  console.log(`Pre-signed URL 발급 중...`);
  const { uploadUrl, cdnUrl } = await getPresignedUrl(UPLOAD_NAME);

  console.log(`S3 업로드 중...`);
  await uploadToS3(buffer, uploadUrl, 'image/png');

  console.log(`\n✅ 업로드 완료!`);
  console.log(`CDN URL: ${cdnUrl}`);
  console.log(`\n이 URL을 src/lib/seo/constants.ts의 OG_IMAGE.url에 설정하세요.`);
}

main().catch((err) => {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
