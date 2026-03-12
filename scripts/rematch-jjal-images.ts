/**
 * contents-mix2.json의 모든 이미지를 삭제하고
 * DB jjals 테이블에서 임베딩 유사도 + 사용량 기반으로 최적의 짤을 매칭하는 스크립트
 *
 * 매칭 로직:
 *   1. 핫픽 title+story로 임베딩 생성 (query 모드)
 *   2. 전체 jjals와 코사인 유사도 계산
 *   3. 상위 후보 중 use_count가 가장 낮은 짤 선택 (중복 방지)
 *   4. IMAGE 타입: 각 옵션별로 별도 매칭
 *
 * 사용법: npx tsx scripts/rematch-jjal-images.ts
 */

import fs from 'fs';
import path from 'path';

import { getDb, closeDb } from './db/index';
import { linkJjalToHotpick } from './db/jjals';
import { createHotpick } from './db/hotpicks';
import { generateEmbedding, cosineSimilarity } from './db/similarity';

const CONTENTS_PATH = path.join(__dirname, '../docs/contents/contents-mix2.json');

interface ContentItem {
  id: number;
  title: string;
  story?: string;
  categories: string[];
  type: 'TEXT' | 'IMAGE';
  options: string[];
  slug: string;
  image?: string;
  optionImages?: string[];
}

interface JjalCandidate {
  key: string;
  s3_url: string;
  tags: string[];
  embedding: number[];
  use_count: number;
}

// 전체 jjals를 메모리에 로드 (9951건, 임베딩 포함)
function loadAllJjals(): JjalCandidate[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT key, s3_url, tags, embedding, use_count FROM jjals WHERE embedding IS NOT NULL AND s3_url IS NOT NULL'
    )
    .all() as Array<{
    key: string;
    s3_url: string;
    tags: string;
    embedding: string;
    use_count: number;
  }>;

  return rows.map((row) => ({
    key: row.key,
    s3_url: row.s3_url,
    tags: JSON.parse(row.tags) as string[],
    embedding: JSON.parse(row.embedding) as number[],
    use_count: row.use_count,
  }));
}

// 유사도 기반 짤 매칭 (상위 candidates 중 use_count 최소 선택)
function findBestJjal(
  queryEmbedding: number[],
  allJjals: JjalCandidate[],
  usedKeys: Set<string>,
  topK = 20
): JjalCandidate | null {
  // 전체 유사도 계산
  const scored = allJjals
    .filter((j) => !usedKeys.has(j.key))
    .map((j) => ({
      ...j,
      score: cosineSimilarity(queryEmbedding, j.embedding),
    }));

  // 유사도 상위 topK 추출
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, topK);

  if (candidates.length === 0) return null;

  // 상위 후보 중 use_count가 가장 낮은 것 선택
  candidates.sort((a, b) => a.use_count - b.use_count);

  const best = candidates[0];
  console.log(
    `    매칭: key=${best.key}, score=${best.score.toFixed(3)}, use_count=${best.use_count}, tags=${best.tags.slice(0, 5).join(',')}`
  );

  return best;
}

async function main() {
  const contents: ContentItem[] = JSON.parse(fs.readFileSync(CONTENTS_PATH, 'utf-8'));
  const db = getDb();

  console.log(`\n=== 짤 이미지 재매칭 시작 ===`);
  console.log(
    `핫픽 수: ${contents.length} (TEXT: ${contents.filter((c) => c.type === 'TEXT').length}, IMAGE: ${contents.filter((c) => c.type === 'IMAGE').length})`
  );

  // Step 1: 모든 이미지 삭제
  console.log('\n[1/4] 기존 이미지 URL 삭제...');
  for (const item of contents) {
    if (item.type === 'TEXT') {
      delete item.image;
    } else if (item.type === 'IMAGE') {
      delete item.optionImages;
    }
  }

  // Step 2: 전체 jjals 메모리 로드
  console.log('[2/4] jjals 데이터 로드 중...');
  const allJjals = loadAllJjals();
  console.log(`  로드 완료: ${allJjals.length}건`);

  // 기존 hotpick_jjals 매핑 초기화
  db.prepare('DELETE FROM hotpick_jjals').run();
  db.prepare('DELETE FROM jjal_usage_log').run();
  // use_count 리셋
  db.prepare('UPDATE jjals SET use_count = 0, last_used_at = NULL').run();
  console.log('  기존 매핑 및 사용량 초기화 완료');

  // 기존 hotpicks 삭제 후 재생성
  db.prepare('DELETE FROM hotpick_categories').run();
  db.prepare('DELETE FROM hotpicks').run();
  console.log('  기존 hotpicks 초기화 완료');

  // Step 3: 핫픽별 매칭
  console.log('[3/4] 핫픽별 짤 매칭 시작...\n');
  const usedKeys = new Set<string>();
  let matchedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];
    console.log(`[${i + 1}/${contents.length}] id:${item.id} "${item.title}" (${item.type})`);

    // DB에 hotpick 저장
    const hotpickId = createHotpick({
      id: item.id,
      title: item.title,
      story: item.story,
      type: item.type,
      slug: item.slug,
      options: item.options,
      categories: item.categories,
    });

    if (item.type === 'TEXT') {
      // TEXT: title + story로 임베딩 생성 → 짤 매칭
      const queryText = `${item.title} ${item.story || ''} ${item.options.join(' ')}`;
      const queryEmb = await generateEmbedding(queryText, true);

      // hotpick 임베딩도 저장
      db.prepare('UPDATE hotpicks SET embedding = ? WHERE id = ?').run(
        JSON.stringify(queryEmb),
        hotpickId
      );

      const best = findBestJjal(queryEmb, allJjals, usedKeys);
      if (best) {
        item.image = best.s3_url;
        usedKeys.add(best.key);
        // DB 매핑
        linkJjalToHotpick(best.key, hotpickId, 'main_image');
        // 메모리상 use_count도 증가
        const jjal = allJjals.find((j) => j.key === best.key);
        if (jjal) jjal.use_count++;
        matchedCount++;
      } else {
        console.log('    ⚠ 매칭 실패');
        failedCount++;
      }
    } else if (item.type === 'IMAGE') {
      // IMAGE: 각 옵션별로 별도 매칭
      const optionImages: string[] = [];
      const titleEmb = await generateEmbedding(`${item.title} ${item.story || ''}`, true);

      // hotpick 임베딩 저장
      db.prepare('UPDATE hotpicks SET embedding = ? WHERE id = ?').run(
        JSON.stringify(titleEmb),
        hotpickId
      );

      for (let optIdx = 0; optIdx < item.options.length; optIdx++) {
        const optionText = `${item.title} ${item.options[optIdx]}`;
        const optEmb = await generateEmbedding(optionText, true);

        console.log(`  옵션 ${optIdx}: "${item.options[optIdx]}"`);
        const best = findBestJjal(optEmb, allJjals, usedKeys);
        if (best) {
          optionImages.push(best.s3_url);
          usedKeys.add(best.key);
          linkJjalToHotpick(best.key, hotpickId, `option_image_${optIdx}`);
          const jjal = allJjals.find((j) => j.key === best.key);
          if (jjal) jjal.use_count++;
          matchedCount++;
        } else {
          optionImages.push('');
          console.log('    ⚠ 매칭 실패');
          failedCount++;
        }
      }
      item.optionImages = optionImages;
    }
  }

  // Step 4: 저장
  console.log('\n[4/4] 결과 저장...');
  fs.writeFileSync(CONTENTS_PATH, JSON.stringify(contents, null, 2), 'utf-8');
  console.log(`  contents-mix2.json 저장 완료`);

  console.log(`\n=== 완료 ===`);
  console.log(`매칭 성공: ${matchedCount}`);
  console.log(`매칭 실패: ${failedCount}`);
  console.log(`사용된 짤: ${usedKeys.size}개 (중복 없음)`);

  closeDb();
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
