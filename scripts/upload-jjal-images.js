/**
 * jjals 테이블의 모든 이미지를 S3에 업로드하고 s3_url 칼럼에 저장하는 스크립트
 *
 * 처리 흐름:
 *   1. DB에서 jjals 데이터를 배치로 조회
 *   2. jjalbang.today URL에서 실제 이미지 URL 추출
 *   3. 이미지 다운로드
 *   4. 500KB 초과 시 sharp로 압축 (GIF 제외)
 *   5. S3 presigned URL로 업로드
 *   6. DB s3_url 칼럼 업데이트
 *   7. 실패 시 최대 2회 재시도, 그래도 실패하면 에러 목록에 기록
 *
 * 사용법: node scripts/upload-jjal-images.js
 * 이어하기: node scripts/upload-jjal-images.js --resume (이미 s3_url이 있는 건 건너뜀)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Database = require('better-sqlite3');
const sharp = require('sharp');

const DB_PATH = path.join(__dirname, '../data/hotpick.db');
const ERROR_LOG_PATH = path.join(__dirname, '../data/jjal-upload-errors.json');
const BASE_DOMAIN = 'https://www.jjalbang.today';
const API_BASE = 'https://hotpick-api.votebox.kr';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 압축 기준: 500KB 초과 시 압축 (GIF는 애니메이션 깨짐 방지를 위해 제외)
const COMPRESS_THRESHOLD = 500 * 1024;
const BATCH_SIZE = 500;
const MAX_RETRIES = 2;
const DELAY_MS = 100;

// ============================
// DB 초기화
// ============================
function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // s3_url 칼럼이 없으면 추가
  const columns = db.prepare("PRAGMA table_info('jjals')").all();
  const hasS3Url = columns.some((col) => col.name === 's3_url');
  if (!hasS3Url) {
    db.prepare('ALTER TABLE jjals ADD COLUMN s3_url TEXT').run();
    console.log('s3_url 칼럼 추가 완료');
  }

  return db;
}

// ============================
// 짤뱅 페이지에서 실제 이미지 URL 추출
// ============================
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client
      .get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchPage(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`타임아웃: ${url}`));
    });
  });
}

async function extractImageUrl(jjalviewUrl) {
  const html = await fetchPage(jjalviewUrl);
  // id='image_url' 인 img 태그의 src 추출
  const match = html.match(/id=['"]image_url['"][^>]*src=['"]([^'"]+)['"]/);
  if (match) return match[1];

  // src가 먼저 나오는 경우
  const match2 = html.match(/src=['"]([^'"]+)['"][^>]*id=['"]image_url['"]/);
  if (match2) return match2[1];

  throw new Error(`이미지 URL을 찾을 수 없습니다: ${jjalviewUrl}`);
}

// ============================
// 이미지 다운로드 (Buffer로)
// ============================
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client
      .get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 30000 }, (res) => {
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`다운로드 타임아웃: ${url}`));
    });
  });
}

// ============================
// 이미지 변환/압축
// - GIF → JPG 변환 (presigned URL API가 .gif/.webp 미지원, 첫 프레임만 추출)
// - 500KB 초과 시 JPG 압축 (품질 80)
// - 1920px 초과 시 리사이즈
// ============================
async function compressIfNeeded(buffer, contentType) {
  const isGif = contentType.includes('gif');

  // GIF는 무조건 JPG로 변환 (presigned URL API가 .gif/.webp 미지원)
  if (isGif) {
    try {
      const converted = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
      console.log(
        `    GIF→JPG: ${(buffer.length / 1024).toFixed(0)}KB → ${(converted.length / 1024).toFixed(0)}KB`
      );
      return { buffer: converted, contentType: 'image/jpeg', compressed: true };
    } catch (err) {
      console.warn(`    GIF 변환 실패: ${err.message}`);
      return { buffer, contentType, compressed: false };
    }
  }

  // 500KB 이하면 압축 불필요
  if (buffer.length <= COMPRESS_THRESHOLD) {
    return { buffer, contentType, compressed: false };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    let sharpInstance = sharp(buffer);

    // 너비가 1920px 초과이면 리사이즈
    if (metadata.width && metadata.width > 1920) {
      sharpInstance = sharpInstance.resize(1920, null, { withoutEnlargement: true });
    }

    // JPG로 변환하여 압축 (품질 80)
    const compressed = await sharpInstance.jpeg({ quality: 80 }).toBuffer();

    // 압축 결과가 원본보다 작을 때만 사용
    if (compressed.length < buffer.length) {
      console.log(
        `    압축: ${(buffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`
      );
      return { buffer: compressed, contentType: 'image/jpeg', compressed: true };
    }

    return { buffer, contentType, compressed: false };
  } catch (err) {
    // 압축 실패 시 원본 그대로 사용
    console.warn(`    압축 실패 (원본 사용): ${err.message}`);
    return { buffer, contentType, compressed: false };
  }
}

// ============================
// S3 Pre-signed URL 발급
// ============================
async function getPresignedUrl(filename) {
  const url = `${API_BASE}/admin/api/v1/storage/presigned?filename=${encodeURIComponent(filename)}`;
  const body = await fetchPage(url);
  const json = JSON.parse(body);
  if (json.code !== 'T0000') {
    throw new Error(`Pre-signed URL 발급 실패: ${json.message}`);
  }
  return { uploadUrl: json.data.uploadUrl, cdnUrl: json.data.cdnUrl };
}

// ============================
// S3에 업로드
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

// ============================
// 단일 짤 처리 (재시도 포함)
// ============================
async function processOneJjal(jjal, index, total) {
  const downloadUrl = `${BASE_DOMAIN}${jjal.url}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1) 짤뱅 페이지에서 실제 이미지 URL 추출
      const realImageUrl = await extractImageUrl(downloadUrl);

      // 2) 이미지 다운로드
      const { buffer: rawBuffer, contentType: rawContentType } = await downloadImage(realImageUrl);

      // 3) 압축 판단 및 실행
      const { buffer, contentType } = await compressIfNeeded(rawBuffer, rawContentType);

      // 4) 파일 확장자 결정 (API가 jpg/png만 지원)
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      const filename = `jjal_${jjal.key}_${Date.now()}.${ext}`;

      // 5) Pre-signed URL 발급
      const { uploadUrl, cdnUrl } = await getPresignedUrl(filename);

      // 6) S3 업로드
      await uploadToS3(buffer, uploadUrl, contentType);

      console.log(`[${index + 1}/${total}] OK (key: ${jjal.key}): ${cdnUrl}`);
      return cdnUrl;
    } catch (err) {
      console.error(
        `[${index + 1}/${total}] 시도 ${attempt}/${MAX_RETRIES} 실패 (key: ${jjal.key}): ${err.message}`
      );
      if (attempt < MAX_RETRIES) {
        // 재시도 전 잠시 대기
        await sleep(1000);
      }
    }
  }

  // 모든 재시도 실패
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================
// 메인 실행
// ============================
async function main() {
  const isResume = process.argv.includes('--resume');
  const db = initDb();

  // 처리 대상 조회
  const totalCount = db
    .prepare(
      isResume
        ? 'SELECT count(*) as cnt FROM jjals WHERE s3_url IS NULL'
        : 'SELECT count(*) as cnt FROM jjals'
    )
    .get().cnt;

  console.log(`\n=== 짤 이미지 S3 업로드 시작 ===`);
  console.log(`총 대상: ${totalCount}건${isResume ? ' (s3_url 없는 것만)' : ''}\n`);

  // resume 모드: s3_url IS NULL인 것만 조회 (offset 항상 0, 처리될 때마다 조건에서 빠짐)
  // 일반 모드: 전체를 id 순으로 조회
  const selectStmt = isResume
    ? db.prepare('SELECT id, key, url FROM jjals WHERE s3_url IS NULL ORDER BY id ASC LIMIT ?')
    : db.prepare('SELECT id, key, url FROM jjals ORDER BY id ASC LIMIT ? OFFSET ?');
  const updateStmt = db.prepare('UPDATE jjals SET s3_url = ? WHERE key = ?');

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  const failedKeys = [];
  // 이전 에러 목록 로드 (이미 실패한 키는 다시 시도하지 않음)
  let previousFailedKeys = new Set();
  if (isResume && fs.existsSync(ERROR_LOG_PATH)) {
    const prev = JSON.parse(fs.readFileSync(ERROR_LOG_PATH, 'utf-8'));
    previousFailedKeys = new Set(prev.map((f) => f.key));
    failedKeys.push(...prev);
    console.log(`이전 에러 목록 로드: ${previousFailedKeys.size}건 (재시도 건너뜀)\n`);
  }
  let processed = 0;

  // 배치 단위로 처리
  if (isResume) {
    // resume 모드: offset 없이 매번 NULL인 것만 가져옴
    while (true) {
      const batch = selectStmt.all(BATCH_SIZE);
      if (batch.length === 0) break;

      // 배치 전체가 이전 실패 키만 있으면 종료 (무한루프 방지)
      const allPreviouslyFailed = batch.every((j) => previousFailedKeys.has(j.key));
      if (allPreviouslyFailed) {
        console.log(`\n남은 ${batch.length}건 모두 이전 실패 키 → 종료`);
        break;
      }

      for (const jjal of batch) {
        processed++;

        // 이전에 실패한 키는 건너뜀
        if (previousFailedKeys.has(jjal.key)) {
          skipCount++;
          continue;
        }

        const cdnUrl = await processOneJjal(jjal, processed - 1, totalCount);

        if (cdnUrl) {
          updateStmt.run(cdnUrl, jjal.key);
          successCount++;
        } else {
          failedKeys.push({
            key: jjal.key,
            url: jjal.url,
            failedAt: new Date().toISOString(),
          });
          previousFailedKeys.add(jjal.key);
          failCount++;
        }

        // Rate limit 방지
        await sleep(DELAY_MS);

        // 50개마다 진행 상황 로그 + 에러 목록 중간 저장
        if (processed % 50 === 0) {
          console.log(
            `\n--- 진행: ${processed}/${totalCount} (성공: ${successCount}, 실패: ${failCount}, 스킵: ${skipCount}) ---\n`
          );
          if (failedKeys.length > 0) {
            fs.writeFileSync(ERROR_LOG_PATH, JSON.stringify(failedKeys, null, 2), 'utf-8');
          }
        }
      }
    }
  } else {
    // 일반 모드: offset 기반 순차 처리
    for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
      const batch = selectStmt.all(BATCH_SIZE, offset);
      if (batch.length === 0) break;

      for (const jjal of batch) {
        processed++;

        // 이미 s3_url이 있으면 건너뜀
        const existing = db.prepare('SELECT s3_url FROM jjals WHERE key = ?').get(jjal.key);
        if (existing && existing.s3_url) {
          skipCount++;
          continue;
        }

        const cdnUrl = await processOneJjal(jjal, processed - 1, totalCount);

        if (cdnUrl) {
          updateStmt.run(cdnUrl, jjal.key);
          successCount++;
        } else {
          failedKeys.push({
            key: jjal.key,
            url: jjal.url,
            failedAt: new Date().toISOString(),
          });
          failCount++;
        }

        // Rate limit 방지
        await sleep(DELAY_MS);

        // 50개마다 진행 상황 로그 + 에러 목록 중간 저장
        if (processed % 50 === 0) {
          console.log(
            `\n--- 진행: ${processed}/${totalCount} (성공: ${successCount}, 실패: ${failCount}, 스킵: ${skipCount}) ---\n`
          );
          if (failedKeys.length > 0) {
            fs.writeFileSync(ERROR_LOG_PATH, JSON.stringify(failedKeys, null, 2), 'utf-8');
          }
        }
      }
    }
  }

  // 최종 에러 목록 저장
  if (failedKeys.length > 0) {
    fs.writeFileSync(ERROR_LOG_PATH, JSON.stringify(failedKeys, null, 2), 'utf-8');
    console.log(`\n에러 목록 저장: ${ERROR_LOG_PATH} (${failedKeys.length}건)`);
  }

  console.log(`\n=== 완료 ===`);
  console.log(`성공: ${successCount}`);
  console.log(`실패: ${failCount}`);
  console.log(`스킵: ${skipCount}`);
  console.log(`실패 키 목록: ${failedKeys.map((f) => f.key).join(', ') || '없음'}`);

  db.close();
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
