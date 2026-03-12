/**
 * contents-mix2.json의 새로 매칭된 짤 이미지를 Real 서버에 업데이트하는 스크립트
 *
 * 흐름:
 *   1. GET /admin/api/v1/hotpicks → slug→backendId 매핑 생성
 *   2. contents-mix2.json 로드
 *   3. 각 핫픽별 GET → 기존 데이터 조회 → 이미지만 교체 → PUT 호출
 *
 * 사용법: node scripts/update-hotpick-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix2.json');
const API_BASE = 'https://hotpick-api.votebox.kr';

const CATEGORY_MAP = {
  love: 1,
  marriage: 2,
  relationship: 3,
  finance: 4,
  work: 5,
  life: 6,
  trend: 7,
};

// ============================
// HTTP 유틸
// ============================
function httpRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch {
          reject(new Error(`Parse error (${res.statusCode}): ${responseData.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`타임아웃: ${url}`));
    });
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================
// 메인
// ============================
async function main() {
  // Step 1: 서버에서 전체 핫픽 목록 조회 → slug→backendId 매핑
  console.log('[1/3] 서버 핫픽 목록 조회 중...');
  const listResult = await httpRequest(`${API_BASE}/admin/api/v1/hotpicks`, 'GET');
  if (listResult.code !== 'T0000') {
    throw new Error(`핫픽 목록 조회 실패: ${listResult.message}`);
  }

  const slugToBackend = {};
  for (const hp of listResult.data) {
    slugToBackend[hp.slug] = {
      id: hp.id,
      election: hp.election,
      categories: hp.categories,
      visible: hp.visible,
    };
  }
  console.log(`  서버 핫픽: ${listResult.data.length}건, 매핑 완료\n`);

  // Step 2: contents-mix2.json 로드
  const contents = JSON.parse(fs.readFileSync(CONTENTS_PATH, 'utf-8'));
  console.log(`[2/3] contents-mix2.json 로드: ${contents.length}건\n`);

  // Step 3: 각 핫픽별 이미지 업데이트
  console.log('[3/3] 이미지 업데이트 시작...\n');
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  const failures = [];

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];
    const backend = slugToBackend[item.slug];

    if (!backend) {
      console.log(`[${i + 1}/${contents.length}] SKIP slug:${item.slug} (서버에 없음)`);
      skipCount++;
      continue;
    }

    const backendId = backend.id;

    // 서버 상세 조회 (기존 election 구조 보존)
    const detailResult = await httpRequest(`${API_BASE}/admin/api/v1/hotpicks/${backendId}`, 'GET');
    if (detailResult.code !== 'T0000') {
      console.error(
        `[${i + 1}/${contents.length}] FAIL 상세조회 slug:${item.slug} → ${detailResult.message}`
      );
      failures.push({ slug: item.slug, error: detailResult.message });
      failCount++;
      await sleep(200);
      continue;
    }

    const serverData = detailResult.data;
    const categoryIds = (serverData.categories || []).map((c) => c.id).filter(Boolean);

    // UpdateHotpickRequest 구성
    const updateBody = {
      type: 'SINGLE',
      slug: item.slug,
      visible: serverData.visible ?? true,
      categoryIds,
      election: {
        title: serverData.election.title,
        items: serverData.election.items.map((serverItem, idx) => {
          const elItem = {
            title: serverItem.title,
            displayOrder: serverItem.displayOrder ?? idx,
          };
          // IMAGE 타입: 옵션별 이미지 교체
          if (item.type === 'IMAGE' && item.optionImages && item.optionImages[idx]) {
            elItem.imageUrl = item.optionImages[idx];
          }
          return elItem;
        }),
      },
    };

    // TEXT 타입: election.imageUrl에 메인 이미지
    if (item.type === 'TEXT' && item.image) {
      updateBody.election.imageUrl = item.image;
    }

    // PUT 요청
    try {
      const updateResult = await httpRequest(
        `${API_BASE}/admin/api/v1/hotpicks/${backendId}`,
        'PUT',
        updateBody
      );

      if (updateResult.code === 'T0000') {
        console.log(`[${i + 1}/${contents.length}] OK id:${backendId} "${item.title}"`);
        successCount++;
      } else {
        console.error(
          `[${i + 1}/${contents.length}] FAIL id:${backendId} "${item.title}" → ${updateResult.message}`
        );
        failures.push({ slug: item.slug, backendId, error: updateResult.message });
        failCount++;
      }
    } catch (err) {
      console.error(
        `[${i + 1}/${contents.length}] ERROR id:${backendId} "${item.title}" → ${err.message}`
      );
      failures.push({ slug: item.slug, backendId, error: err.message });
      failCount++;
    }

    // Rate limit 방지
    await sleep(200);
  }

  // 결과 출력
  console.log(`\n=== 완료 ===`);
  console.log(`성공: ${successCount}`);
  console.log(`실패: ${failCount}`);
  console.log(`스킵: ${skipCount}`);

  if (failures.length > 0) {
    const errorPath = path.join(__dirname, '../data/update-hotpick-errors.json');
    fs.writeFileSync(errorPath, JSON.stringify(failures, null, 2), 'utf-8');
    console.log(`\n에러 목록 저장: ${errorPath}`);
  }
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
