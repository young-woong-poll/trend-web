/**
 * contents-mix2.json의 핫픽을 createHotpick API로 전송하는 스크립트
 * id 내림차순으로 전송 (최신순 정렬이므로 id:1이 가장 마지막에 전송되어 상위 노출)
 *
 * 사용법: node scripts/upload-hotpicks-mix2.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix2.json');
const API_BASE = 'https://hotpick-api.votebox.kr';

// 카테고리 slug → id 매핑
const CATEGORY_MAP = {
  love: 1,
  marriage: 2,
  relationship: 3,
  finance: 4,
  work: 5,
  life: 6,
  trend: 7,
};

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch {
          reject(new Error(`Parse error: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const contents = JSON.parse(fs.readFileSync(CONTENTS_PATH, 'utf-8'));

  // id 내림차순 정렬 (id:1이 마지막에 전송 → 상위 노출)
  const items = contents.sort((a, b) => b.id - a.id);

  console.log(
    `총 ${items.length}개 핫픽 전송 시작 (id:${items[0].id} → id:${items[items.length - 1].id})\n`
  );

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const categoryIds = item.categories.map((slug) => CATEGORY_MAP[slug]).filter(Boolean);

    const body = {
      type: 'SINGLE',
      slug: item.slug,
      visible: true,
      categoryIds,
      election: {
        title: item.title,
        items: item.options.map((opt, idx) => {
          const elItem = { title: opt, displayOrder: idx };
          // IMAGE 타입: 옵션별 이미지
          if (item.type === 'IMAGE' && item.optionImages && item.optionImages[idx]) {
            elItem.imageUrl = item.optionImages[idx];
          }
          return elItem;
        }),
      },
    };

    // TEXT 타입: election.imageUrl에 메인 이미지
    if (item.type === 'TEXT' && item.image) {
      body.election.imageUrl = item.image;
    }

    try {
      const result = await postJson(`${API_BASE}/admin/api/v1/hotpicks`, body);
      if (result.code === 'T0000') {
        console.log(
          `[${i + 1}/${items.length}] OK id:${item.id} → hotpick:${result.data.id} "${item.title}"`
        );
        successCount++;
      } else {
        console.error(
          `[${i + 1}/${items.length}] FAIL id:${item.id} "${item.title}" → ${result.message}`
        );
        failCount++;
      }
    } catch (err) {
      console.error(
        `[${i + 1}/${items.length}] ERROR id:${item.id} "${item.title}" → ${err.message}`
      );
      failCount++;
    }

    // Rate limit 방지 (200ms 간격)
    if (i < items.length - 1) {
      await sleep(200);
    }
  }

  console.log(`\n완료! 성공: ${successCount}, 실패: ${failCount}`);
}

main().catch(console.error);
