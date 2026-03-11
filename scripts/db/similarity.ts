/**
 * 임베딩 생성 + 유사도 검사 모듈
 * 로컬 모델: @huggingface/transformers + multilingual-e5-small
 *
 * 사용법:
 *   npx tsx scripts/db/similarity.ts --generate        # 전체 임베딩 생성
 *   npx tsx scripts/db/similarity.ts --check-all       # 전체 중복 검사
 *   npx tsx scripts/db/similarity.ts --check "제목"    # 특정 텍스트 유사도 검사
 */

// eslint-disable-next-line no-restricted-imports
import { getDb, closeDb } from './index';

// @huggingface/transformers는 ESM 모듈이므로 동적 import 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineInstance: any = null;

async function getEmbeddingPipeline() {
  if (!pipelineInstance) {
    const { pipeline } = await import('@huggingface/transformers');
    console.log('[임베딩] multilingual-e5-small 모델 로딩 중...');
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
      dtype: 'q8',
    });
    console.log('[임베딩] 모델 로딩 완료');
  }
  return pipelineInstance;
}

// multilingual-e5 모델은 query/passage prefix를 요구
function formatForEmbedding(text: string, isQuery = false): string {
  return isQuery ? `query: ${text}` : `passage: ${text}`;
}

export async function generateEmbedding(text: string, isQuery = false): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const formatted = formatForEmbedding(text, isQuery);
  const output = await pipe(formatted, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function generateEmbeddings(texts: string[], isQuery = false): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const formatted = texts.map((t) => formatForEmbedding(t, isQuery));
  const results: number[][] = [];

  // 배치 처리 (메모리 관리를 위해 10개씩)
  const batchSize = 10;
  for (let i = 0; i < formatted.length; i += batchSize) {
    const batch = formatted.slice(i, i + batchSize);
    for (const text of batch) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data as Float32Array));
    }
    if (i + batchSize < formatted.length) {
      process.stdout.write(
        `  [${Math.min(i + batchSize, formatted.length)}/${formatted.length}]\r`
      );
    }
  }

  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SimilarResult {
  id: number;
  title: string;
  similarity: number;
}

export function findSimilarHotpicks(
  embedding: number[],
  threshold = 0.92,
  excludeId?: number
): SimilarResult[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, title, embedding FROM hotpicks WHERE embedding IS NOT NULL')
    .all() as Array<{ id: number; title: string; embedding: string }>;

  return rows
    .filter((row) => row.id !== excludeId)
    .map((row) => ({
      id: row.id,
      title: row.title,
      similarity: cosineSimilarity(embedding, JSON.parse(row.embedding)),
    }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

// --- 짤 의미 매칭 ---

export interface JjalMatchResult {
  key: string;
  url: string;
  tags: string[];
  score: number;
  use_count: number;
}

export function findMatchingJjals(
  queryEmbedding: number[],
  limit = 10,
  ftsQuery?: string
): JjalMatchResult[] {
  const db = getDb();

  let rows: Array<{ key: string; url: string; tags: string; embedding: string; use_count: number }>;

  if (ftsQuery) {
    // FTS 1차 필터 + 임베딩 2차 랭킹
    rows = db
      .prepare(
        `SELECT j.key, j.url, j.tags, j.embedding, j.use_count
         FROM jjals j
         JOIN jjals_fts f ON j.id = f.rowid
         WHERE j.embedding IS NOT NULL AND jjals_fts MATCH ?
         LIMIT 200`
      )
      .all(ftsQuery) as typeof rows;
  } else {
    // 임베딩만으로 검색 (전체 스캔)
    rows = db
      .prepare('SELECT key, url, tags, embedding, use_count FROM jjals WHERE embedding IS NOT NULL')
      .all() as typeof rows;
  }

  return rows
    .map((row) => ({
      key: row.key,
      url: row.url,
      tags: JSON.parse(row.tags) as string[],
      score: cosineSimilarity(queryEmbedding, JSON.parse(row.embedding)),
      use_count: row.use_count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- CLI 명령어 ---

async function generateAllHotpickEmbeddings(): Promise<void> {
  const db = getDb();
  const rows = db.prepare('SELECT id, title, options FROM hotpicks').all() as Array<{
    id: number;
    title: string;
    options: string;
  }>;

  console.log(`[핫픽] ${rows.length}개 임베딩 생성 시작`);

  const updateStmt = db.prepare('UPDATE hotpicks SET embedding = ? WHERE id = ?');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const options = JSON.parse(row.options) as string[];
    const text = `${row.title} ${options.join(' ')}`;
    const embedding = await generateEmbedding(text);
    updateStmt.run(JSON.stringify(embedding), row.id);
    process.stdout.write(`  [핫픽 ${i + 1}/${rows.length}]\r`);
  }
  console.log(`\n[핫픽] ${rows.length}개 임베딩 생성 완료`);
}

async function generateAllJjalEmbeddings(): Promise<void> {
  const db = getDb();
  const total = (db.prepare('SELECT count(*) as cnt FROM jjals').get() as { cnt: number }).cnt;
  const batchSize = 100;

  console.log(`[짤] ${total}개 임베딩 생성 시작 (시간이 걸릴 수 있습니다)`);

  const updateStmt = db.prepare('UPDATE jjals SET embedding = ? WHERE key = ?');
  let processed = 0;

  for (let offset = 0; offset < total; offset += batchSize) {
    const rows = db
      .prepare('SELECT key, tags FROM jjals LIMIT ? OFFSET ?')
      .all(batchSize, offset) as Array<{ key: string; tags: string }>;

    for (const row of rows) {
      const tags = JSON.parse(row.tags) as string[];
      const text = tags.join(' ');
      const embedding = await generateEmbedding(text);
      updateStmt.run(JSON.stringify(embedding), row.key);
      processed++;
      process.stdout.write(`  [짤 ${processed}/${total}]\r`);
    }
  }
  console.log(`\n[짤] ${total}개 임베딩 생성 완료`);
}

async function checkAllDuplicates(): Promise<void> {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, title, embedding FROM hotpicks WHERE embedding IS NOT NULL')
    .all() as Array<{ id: number; title: string; embedding: string }>;

  if (rows.length === 0) {
    console.log('임베딩이 생성된 핫픽이 없습니다. --generate를 먼저 실행하세요.');
    return;
  }

  console.log(`${rows.length}개 핫픽 중복 검사 중...\n`);

  const checked = new Set<string>();
  let duplicateCount = 0;

  for (const a of rows) {
    const embA = JSON.parse(a.embedding) as number[];
    for (const b of rows) {
      if (a.id >= b.id) {
        continue;
      }
      const pairKey = `${a.id}-${b.id}`;
      if (checked.has(pairKey)) {
        continue;
      }
      checked.add(pairKey);

      const embB = JSON.parse(b.embedding) as number[];
      const sim = cosineSimilarity(embA, embB);
      if (sim >= 0.92) {
        console.log(
          `  [유사도 ${(sim * 100).toFixed(1)}%] id:${a.id} "${a.title}" ↔ id:${b.id} "${b.title}"`
        );
        duplicateCount++;
      }
    }
  }

  console.log(`\n검사 완료: ${duplicateCount}개 유사 콘텐츠 발견`);
}

async function checkSingleText(text: string): Promise<void> {
  console.log(`"${text}" 유사도 검사 중...\n`);
  const embedding = await generateEmbedding(text, true);
  const similar = findSimilarHotpicks(embedding, 0.5);

  if (similar.length === 0) {
    console.log('유사한 핫픽이 없습니다.');
    return;
  }

  for (const item of similar.slice(0, 10)) {
    const marker = item.similarity >= 0.92 ? '⚠️ 중복' : '  참고';
    console.log(
      `  ${marker} [${(item.similarity * 100).toFixed(1)}%] id:${item.id} "${item.title}"`
    );
  }
}

// CLI 진입점
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--generate')) {
    await generateAllHotpickEmbeddings();
    // 짤 임베딩은 10K건이라 시간이 오래 걸림 → 별도 플래그로 분리
    if (args.includes('--jjals')) {
      await generateAllJjalEmbeddings();
    }
  } else if (args.includes('--check-all')) {
    await checkAllDuplicates();
  } else if (args.includes('--check')) {
    const idx = args.indexOf('--check');
    const text = args[idx + 1];
    if (!text) {
      console.error('사용법: npx tsx scripts/db/similarity.ts --check "검사할 텍스트"');
      process.exit(1);
    }
    await checkSingleText(text);
  } else {
    console.log('사용법:');
    console.log('  npx tsx scripts/db/similarity.ts --generate          핫픽 임베딩 생성');
    console.log('  npx tsx scripts/db/similarity.ts --generate --jjals  핫픽+짤 임베딩 생성');
    console.log('  npx tsx scripts/db/similarity.ts --check-all         전체 중복 검사');
    console.log('  npx tsx scripts/db/similarity.ts --check "텍스트"   특정 텍스트 유사도 검사');
  }

  closeDb();
}

main().catch(console.error);
