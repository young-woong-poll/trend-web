/**
 * SQLite DB에서 status='ready'인 핫픽을 백엔드 API로 업로드
 * 기존 upload-hotpicks.js의 SQLite 기반 리팩터 버전
 *
 * 실행: npx tsx scripts/upload-hotpicks.ts
 */

import https from 'https';

// eslint-disable-next-line no-restricted-imports
import { getUploadCandidates, markAsUploaded } from './db/hotpicks';
// eslint-disable-next-line no-restricted-imports
import { getDb, closeDb } from './db/index';
// eslint-disable-next-line no-restricted-imports
import { getJjalsForHotpick } from './db/jjals';

const API_BASE = 'https://hotpick-api.votebox.kr';

const CATEGORY_MAP: Record<string, number> = {
  love: 1,
  marriage: 2,
  relationship: 3,
  finance: 4,
  work: 5,
  life: 6,
  trend: 7,
};

function postJson(
  url: string,
  body: unknown
): Promise<{ code: string; data?: { id: number }; message?: string }> {
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
      res.on('data', (chunk: string) => (responseData += chunk));
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const candidates = getUploadCandidates();

  if (candidates.length === 0) {
    console.log("업로드할 핫픽이 없습니다. (status='ready'인 항목 없음)");
    closeDb();
    return;
  }

  // 카테고리 조회용
  const db = getDb();

  console.log(`총 ${candidates.length}개 핫픽 업로드 시작\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const hotpick = candidates[i];

    // 카테고리 조회
    const categories = db
      .prepare(
        `SELECT c.slug FROM categories c
         JOIN hotpick_categories hc ON c.id = hc.category_id
         WHERE hc.hotpick_id = ?`
      )
      .all(hotpick.id) as Array<{ slug: string }>;

    const categoryIds = categories.map((c) => CATEGORY_MAP[c.slug]).filter(Boolean);

    // 짤 매핑 조회
    const jjals = getJjalsForHotpick(hotpick.id);
    const mainImageJjal = jjals.find((j) => j.usage_type === 'main_image');

    const body: Record<string, unknown> = {
      type: 'SINGLE',
      slug: hotpick.slug,
      visible: true,
      categoryIds,
      election: {
        title: hotpick.title,
        imageUrl: mainImageJjal?.url || undefined,
        items: hotpick.options.map((opt, idx) => {
          const optionJjal = jjals.find((j) => j.usage_type === `option_image_${idx}`);
          const elItem: Record<string, unknown> = { title: opt, displayOrder: idx };
          if (hotpick.type === 'IMAGE' && optionJjal) {
            elItem.imageUrl = optionJjal.url;
          }
          return elItem;
        }),
      },
    };

    try {
      const result = await postJson(`${API_BASE}/admin/api/v1/hotpicks`, body);
      if (result.code === 'T0000' && result.data) {
        markAsUploaded(hotpick.id, result.data.id);
        console.log(
          `[${i + 1}/${candidates.length}] OK id:${hotpick.id} → backend:${result.data.id} "${hotpick.title}"`
        );
        successCount++;
      } else {
        console.error(
          `[${i + 1}/${candidates.length}] FAIL id:${hotpick.id} "${hotpick.title}" → ${result.message}`
        );
        failCount++;
      }
    } catch (err) {
      console.error(
        `[${i + 1}/${candidates.length}] ERROR id:${hotpick.id} "${hotpick.title}" → ${(err as Error).message}`
      );
      failCount++;
    }

    if (i < candidates.length - 1) {
      await sleep(200);
    }
  }

  console.log(`\n완료! 성공: ${successCount}, 실패: ${failCount}`);
  closeDb();
}

main().catch(console.error);
