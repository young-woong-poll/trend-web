/**
 * 번들 캐릭터 이미지를 S3에 업로드하는 스크립트
 *
 * 사용법: node scripts/upload-character-images.js
 *
 * 처리 흐름:
 *   1. src/assets/img/characters/ 폴더의 PNG 파일 읽기
 *   2. presigned URL 발급
 *   3. S3 업로드
 *   4. CDN URL 출력
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = 'https://hotpick-api.votebox.kr';
const CHARACTERS_DIR = path.join(__dirname, '../src/assets/img/characters');

// 파일명 → 업로드 파일명 매핑
const FILES = [
  { file: '01-LION.png', name: 'character-lion.png' },
  { file: '02-FOX.png', name: 'character-fox.png' },
  { file: '03-PANDA.png', name: 'character-panda.png' },
  { file: '04-CAT.png', name: 'character-cat.png' },
  { file: '05-UNICORN.png', name: 'character-unicorn.png' },
];

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
      timeout: 60000,
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('S3 업로드 타임아웃'));
    });
    req.write(buffer);
    req.end();
  });
}

async function main() {
  console.log('🎨 번들 캐릭터 이미지 업로드 시작\n');

  const results = [];

  for (const { file, name } of FILES) {
    const filePath = path.join(CHARACTERS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ 파일 없음: ${file}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const sizeKB = (buffer.length / 1024).toFixed(1);
    console.log(`📁 ${file} (${sizeKB}KB)`);

    try {
      // 1. Presigned URL 발급
      const { uploadUrl, cdnUrl } = await getPresignedUrl(name);
      console.log(`   ✅ presigned URL 발급`);

      // 2. S3 업로드
      await uploadToS3(buffer, uploadUrl, 'image/png');
      console.log(`   ✅ S3 업로드 완료`);
      console.log(`   🔗 ${cdnUrl}\n`);

      results.push({ file, name, cdnUrl });
    } catch (err) {
      console.log(`   ❌ 실패: ${err.message}\n`);
    }
  }

  console.log('\n═══ 업로드 결과 ═══\n');
  for (const r of results) {
    console.log(`${r.file}: ${r.cdnUrl}`);
  }

  console.log('\n═══ constants/bundle.ts 에 넣을 값 ═══\n');
  const gradeMap = ['KING', 'LEADER', 'BALANCER', 'REBEL', 'UNICORN'];
  for (let i = 0; i < results.length; i++) {
    console.log(`  // ${gradeMap[i]}`);
    console.log(`  imagePath: '${results[i].cdnUrl}',`);
  }
}

main().catch(console.error);
