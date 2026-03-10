/**
 * JSON 파일 → SQLite 마이그레이션 스크립트
 * 실행: npx tsx scripts/db/seed.ts
 */

import fs from 'fs';
import path from 'path';

// eslint-disable-next-line no-restricted-imports
import { getDb, closeDb } from './index';

interface ContentItem {
  id: number;
  title: string;
  story?: string;
  categories: string[];
  type: 'TEXT' | 'IMAGE';
  options: string[];
  optionImages?: string[];
  image?: string;
  slug: string;
}

interface JjalItem {
  key: string;
  tag: string[];
  url: string;
}

const CATEGORY_MAP: Record<string, number> = {
  love: 1,
  marriage: 2,
  relationship: 3,
  finance: 4,
  work: 5,
  life: 6,
  trend: 7,
};

function seedCategories(): void {
  const db = getDb();
  const insert = db.prepare('INSERT OR IGNORE INTO categories (id, slug) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const [slug, id] of Object.entries(CATEGORY_MAP)) {
      insert.run(id, slug);
    }
  });
  tx();
  console.log(`[categories] ${Object.keys(CATEGORY_MAP).length}개 시드 완료`);
}

function seedJjals(): void {
  const db = getDb();
  const jjalPath = path.join(__dirname, '../../docs/contents/jjal-db.json');
  const jjals: JjalItem[] = JSON.parse(fs.readFileSync(jjalPath, 'utf-8'));

  const insert = db.prepare('INSERT OR IGNORE INTO jjals (key, url, tags) VALUES (?, ?, ?)');

  const tx = db.transaction(() => {
    for (const jjal of jjals) {
      insert.run(jjal.key, jjal.url, JSON.stringify(jjal.tag));
    }
  });
  tx();
  console.log(`[jjals] ${jjals.length}개 시드 완료`);
}

function seedHotpicks(): void {
  const db = getDb();
  const contentsPath = path.join(__dirname, '../../docs/contents/contents-mix.json');
  const contents: ContentItem[] = JSON.parse(fs.readFileSync(contentsPath, 'utf-8'));

  const insertHotpick = db.prepare(
    `INSERT OR IGNORE INTO hotpicks (id, title, story, type, slug, options, status)
     VALUES (?, ?, ?, ?, ?, ?, 'uploaded')`
  );

  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO hotpick_categories (hotpick_id, category_id) VALUES (?, ?)'
  );

  const insertJjalMapping = db.prepare(
    'INSERT OR IGNORE INTO hotpick_jjals (hotpick_id, jjal_key, usage_type) VALUES (?, ?, ?)'
  );

  // CDN URL → jjal key 매핑 파일 로드 (있으면)
  const urlMapPath = path.join(__dirname, '../../data/url-to-jjal-map.json');
  let urlToJjalMap: Record<string, string> = {};
  if (fs.existsSync(urlMapPath)) {
    urlToJjalMap = JSON.parse(fs.readFileSync(urlMapPath, 'utf-8'));
    console.log(`[매핑] url-to-jjal-map.json 로드 (${Object.keys(urlToJjalMap).length}건)`);
  } else {
    console.log('[매핑] url-to-jjal-map.json 없음 → hotpick_jjals 매핑 스킵');
  }

  let jjalMappingCount = 0;

  const tx = db.transaction(() => {
    for (const item of contents) {
      // 핫픽 삽입
      insertHotpick.run(
        item.id,
        item.title,
        item.story || null,
        item.type,
        item.slug,
        JSON.stringify(item.options)
      );

      // 카테고리 매핑
      for (const catSlug of item.categories) {
        const catId = CATEGORY_MAP[catSlug];
        if (catId) {
          insertCategory.run(item.id, catId);
        }
      }

      // 짤 매핑: 매핑 파일이 있으면 CDN URL → jjal key로 hotpick_jjals INSERT
      if (Object.keys(urlToJjalMap).length > 0) {
        // TEXT 타입: main_image
        if (item.image) {
          const jjalKey = urlToJjalMap[item.image];
          if (jjalKey) {
            insertJjalMapping.run(item.id, jjalKey, 'main_image');
            jjalMappingCount++;
          }
        }
        // IMAGE 타입: option_image_N
        if (item.optionImages) {
          for (let i = 0; i < item.optionImages.length; i++) {
            const jjalKey = urlToJjalMap[item.optionImages[i]];
            if (jjalKey) {
              insertJjalMapping.run(item.id, jjalKey, `option_image_${i}`);
              jjalMappingCount++;
            }
          }
        }
      }
    }
  });
  tx();
  console.log(`[hotpicks] ${contents.length}개 시드 완료`);
  if (jjalMappingCount > 0) {
    console.log(`[hotpick_jjals] ${jjalMappingCount}개 매핑 완료`);
  }
}

function main(): void {
  console.log('=== HotPick DB 시드 시작 ===\n');

  seedCategories();
  seedJjals();
  seedHotpicks();

  const db = getDb();
  const hotpickCount = db.prepare('SELECT count(*) as cnt FROM hotpicks').get() as { cnt: number };
  const jjalCount = db.prepare('SELECT count(*) as cnt FROM jjals').get() as { cnt: number };
  const categoryCount = db.prepare('SELECT count(*) as cnt FROM categories').get() as {
    cnt: number;
  };

  console.log(`\n=== 시드 완료 ===`);
  console.log(`  hotpicks:   ${hotpickCount.cnt}건`);
  console.log(`  jjals:      ${jjalCount.cnt}건`);
  console.log(`  categories: ${categoryCount.cnt}건`);

  closeDb();
}

main();
