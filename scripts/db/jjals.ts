/**
 * 짤 CRUD + FTS 검색 + 사용 추적 모듈
 */

// eslint-disable-next-line no-restricted-imports
import { getDb } from './index';

export interface Jjal {
  id: number;
  key: string;
  url: string;
  tags: string[];
  embedding: number[] | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface JjalRow {
  id: number;
  key: string;
  url: string;
  tags: string;
  embedding: string | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface JjalUsageLog {
  id: number;
  jjal_key: string;
  hotpick_id: number | null;
  context: string | null;
  used_at: string;
}

function rowToJjal(row: JjalRow): Jjal {
  return {
    ...row,
    tags: JSON.parse(row.tags),
    embedding: row.embedding ? JSON.parse(row.embedding) : null,
  };
}

// --- CRUD ---

export function getJjalByKey(key: string): Jjal | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jjals WHERE key = ?').get(key) as JjalRow | undefined;
  return row ? rowToJjal(row) : undefined;
}

export function getAllJjals(limit = 100, offset = 0): Jjal[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM jjals ORDER BY id ASC LIMIT ? OFFSET ?')
    .all(limit, offset) as JjalRow[];
  return rows.map(rowToJjal);
}

export function getJjalCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT count(*) as cnt FROM jjals').get() as { cnt: number };
  return row.cnt;
}

// --- FTS 검색 ---

export function searchJjalsByKeyword(query: string, limit = 50): Jjal[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT j.* FROM jjals j
       JOIN jjals_fts f ON j.id = f.rowid
       WHERE jjals_fts MATCH ?
       LIMIT ?`
    )
    .all(query, limit) as JjalRow[];
  return rows.map(rowToJjal);
}

export function searchJjalsByTag(tag: string, limit = 50): Jjal[] {
  const db = getDb();
  // tags는 JSON array이므로 LIKE로 검색
  const rows = db
    .prepare(`SELECT * FROM jjals WHERE tags LIKE ? LIMIT ?`)
    .all(`%"${tag}"%`, limit) as JjalRow[];
  return rows.map(rowToJjal);
}

// --- 사용 추적 ---

export function linkJjalToHotpick(jjalKey: string, hotpickId: number, usageType: string): void {
  const db = getDb();
  const tx = db.transaction(() => {
    // hotpick_jjals 매핑 추가
    db.prepare(
      'INSERT OR REPLACE INTO hotpick_jjals (hotpick_id, jjal_key, usage_type) VALUES (?, ?, ?)'
    ).run(hotpickId, jjalKey, usageType);

    // 사용 이력 로그
    db.prepare('INSERT INTO jjal_usage_log (jjal_key, hotpick_id, context) VALUES (?, ?, ?)').run(
      jjalKey,
      hotpickId,
      usageType
    );

    // 사용 카운터 증가
    db.prepare(
      "UPDATE jjals SET use_count = use_count + 1, last_used_at = datetime('now') WHERE key = ?"
    ).run(jjalKey);
  });
  tx();
}

export function unlinkJjalFromHotpick(jjalKey: string, hotpickId: number, usageType: string): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM hotpick_jjals WHERE hotpick_id = ? AND jjal_key = ? AND usage_type = ?'
  ).run(hotpickId, jjalKey, usageType);
}

export function getJjalsForHotpick(hotpickId: number): Array<Jjal & { usage_type: string }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT j.*, hj.usage_type FROM jjals j
       JOIN hotpick_jjals hj ON j.key = hj.jjal_key
       WHERE hj.hotpick_id = ?
       ORDER BY hj.usage_type`
    )
    .all(hotpickId) as (JjalRow & { usage_type: string })[];
  return rows.map((row) => ({
    ...rowToJjal(row),
    usage_type: row.usage_type,
  }));
}

export function getHotpicksForJjal(
  jjalKey: string
): Array<{ hotpick_id: number; usage_type: string }> {
  const db = getDb();
  return db
    .prepare('SELECT hotpick_id, usage_type FROM hotpick_jjals WHERE jjal_key = ?')
    .all(jjalKey) as Array<{ hotpick_id: number; usage_type: string }>;
}

export function getUnderusedJjals(limit = 50): Jjal[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM jjals ORDER BY use_count ASC, id ASC LIMIT ?')
    .all(limit) as JjalRow[];
  return rows.map(rowToJjal);
}

export function getJjalUsageLog(jjalKey: string, limit = 20): JjalUsageLog[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM jjal_usage_log WHERE jjal_key = ? ORDER BY used_at DESC LIMIT ?')
    .all(jjalKey, limit) as JjalUsageLog[];
}
