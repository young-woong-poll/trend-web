/**
 * 핫픽 CRUD 모듈
 */

// eslint-disable-next-line no-restricted-imports
import { getDb } from './index';

export interface Hotpick {
  id: number;
  title: string;
  story: string | null;
  type: 'TEXT' | 'IMAGE';
  slug: string;
  options: string[];
  status: 'draft' | 'ready' | 'uploaded';
  backend_id: number | null;
  embedding: number[] | null;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: string[];
}

export interface CreateHotpickInput {
  id?: number;
  title: string;
  story?: string;
  type: 'TEXT' | 'IMAGE';
  slug: string;
  options: string[];
  categories: string[];
}

interface HotpickRow {
  id: number;
  title: string;
  story: string | null;
  type: string;
  slug: string;
  options: string;
  status: string;
  backend_id: number | null;
  embedding: string | null;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToHotpick(row: HotpickRow): Hotpick {
  return {
    ...row,
    type: row.type as Hotpick['type'],
    status: row.status as Hotpick['status'],
    options: JSON.parse(row.options),
    embedding: row.embedding ? JSON.parse(row.embedding) : null,
  };
}

export function getAllHotpicks(filter?: {
  type?: string;
  status?: string;
  categorySlug?: string;
}): Hotpick[] {
  const db = getDb();
  let sql = 'SELECT DISTINCT h.* FROM hotpicks h';
  const params: string[] = [];
  const conditions: string[] = [];

  if (filter?.categorySlug) {
    sql += ' JOIN hotpick_categories hc ON h.id = hc.hotpick_id';
    sql += ' JOIN categories c ON hc.category_id = c.id';
    conditions.push('c.slug = ?');
    params.push(filter.categorySlug);
  }

  if (filter?.type) {
    conditions.push('h.type = ?');
    params.push(filter.type);
  }

  if (filter?.status) {
    conditions.push('h.status = ?');
    params.push(filter.status);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY h.id ASC';

  const rows = db.prepare(sql).all(...params) as HotpickRow[];
  return rows.map(rowToHotpick);
}

export function getHotpickById(id: number): Hotpick | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM hotpicks WHERE id = ?').get(id) as HotpickRow | undefined;
  return row ? rowToHotpick(row) : undefined;
}

export function getHotpickBySlug(slug: string): Hotpick | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM hotpicks WHERE slug = ?').get(slug) as
    | HotpickRow
    | undefined;
  return row ? rowToHotpick(row) : undefined;
}

export function createHotpick(data: CreateHotpickInput): number {
  const db = getDb();
  const CATEGORY_MAP: Record<string, number> = {
    love: 1,
    marriage: 2,
    relationship: 3,
    finance: 4,
    work: 5,
    life: 6,
    trend: 7,
  };

  const insertHotpick = db.prepare(
    `INSERT INTO hotpicks (${data.id ? 'id, ' : ''}title, story, type, slug, options)
     VALUES (${data.id ? '?, ' : ''}?, ?, ?, ?, ?)`
  );

  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO hotpick_categories (hotpick_id, category_id) VALUES (?, ?)'
  );

  const tx = db.transaction(() => {
    const params = data.id
      ? [
          data.id,
          data.title,
          data.story || null,
          data.type,
          data.slug,
          JSON.stringify(data.options),
        ]
      : [data.title, data.story || null, data.type, data.slug, JSON.stringify(data.options)];

    const result = insertHotpick.run(...params);
    const hotpickId = data.id || (result.lastInsertRowid as number);

    for (const catSlug of data.categories) {
      const catId = CATEGORY_MAP[catSlug];
      if (catId) {
        insertCategory.run(hotpickId, catId);
      }
    }

    return hotpickId;
  });

  return tx();
}

export function updateHotpick(
  id: number,
  data: Partial<Pick<CreateHotpickInput, 'title' | 'story' | 'type' | 'slug' | 'options'>>
): void {
  const db = getDb();
  const sets: string[] = [];
  const params: (string | null)[] = [];

  if (data.title !== undefined) {
    sets.push('title = ?');
    params.push(data.title);
  }
  if (data.story !== undefined) {
    sets.push('story = ?');
    params.push(data.story || null);
  }
  if (data.type !== undefined) {
    sets.push('type = ?');
    params.push(data.type);
  }
  if (data.slug !== undefined) {
    sets.push('slug = ?');
    params.push(data.slug);
  }
  if (data.options !== undefined) {
    sets.push('options = ?');
    params.push(JSON.stringify(data.options));
  }

  if (sets.length === 0) {
    return;
  }

  sets.push("updated_at = datetime('now')");
  params.push(String(id));

  db.prepare(`UPDATE hotpicks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
}

export function setHotpickStatus(id: number, status: Hotpick['status']): void {
  const db = getDb();
  db.prepare("UPDATE hotpicks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    id
  );
}

export function markAsUploaded(id: number, backendId: number): void {
  const db = getDb();
  db.prepare(
    "UPDATE hotpicks SET status = 'uploaded', backend_id = ?, uploaded_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(backendId, id);
}

export function getUploadCandidates(): Hotpick[] {
  return getAllHotpicks({ status: 'ready' });
}

export function getNextId(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(id) as maxId FROM hotpicks').get() as { maxId: number | null };
  return (row.maxId || 0) + 1;
}
