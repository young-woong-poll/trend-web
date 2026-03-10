-- HotPick 로컬 콘텐츠 관리 DB 스키마
-- SQLite + better-sqlite3

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 카테고리
CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE
);

-- 핫픽 콘텐츠
CREATE TABLE IF NOT EXISTS hotpicks (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  story       TEXT,
  type        TEXT NOT NULL CHECK(type IN ('TEXT', 'IMAGE')),
  slug        TEXT NOT NULL UNIQUE,
  options     TEXT NOT NULL,       -- JSON array of strings
  status      TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'ready', 'uploaded')),
  backend_id  INTEGER,
  embedding   TEXT,                -- JSON array (multilingual-e5-small, 384차원)
  uploaded_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 핫픽-카테고리 다대다
CREATE TABLE IF NOT EXISTS hotpick_categories (
  hotpick_id  INTEGER NOT NULL REFERENCES hotpicks(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (hotpick_id, category_id)
);

-- 짤 메타데이터
CREATE TABLE IF NOT EXISTS jjals (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  key          TEXT NOT NULL UNIQUE,
  url          TEXT NOT NULL,
  tags         TEXT NOT NULL,        -- JSON array of Korean keywords
  embedding    TEXT,                 -- JSON array (multilingual-e5-small, 384차원)
  use_count    INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 핫픽-짤 매핑 (현재 사용 중인 짤)
CREATE TABLE IF NOT EXISTS hotpick_jjals (
  hotpick_id INTEGER NOT NULL REFERENCES hotpicks(id) ON DELETE CASCADE,
  jjal_key   TEXT NOT NULL REFERENCES jjals(key),
  usage_type TEXT NOT NULL,          -- 'main_image' | 'option_image_0' | 'option_image_1' | ...
  PRIMARY KEY (hotpick_id, jjal_key, usage_type)
);

-- 짤 사용 이력 로그
CREATE TABLE IF NOT EXISTS jjal_usage_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  jjal_key   TEXT NOT NULL REFERENCES jjals(key),
  hotpick_id INTEGER REFERENCES hotpicks(id),
  context    TEXT,
  used_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jjal_usage_jjal ON jjal_usage_log(jjal_key);

-- 짤 FTS5 전문검색 (태그 키워드 검색)
CREATE VIRTUAL TABLE IF NOT EXISTS jjals_fts USING fts5(
  key, tags,
  content='jjals',
  content_rowid='id'
);

-- FTS 동기화 트리거
CREATE TRIGGER IF NOT EXISTS jjals_ai AFTER INSERT ON jjals BEGIN
  INSERT INTO jjals_fts(rowid, key, tags) VALUES (new.id, new.key, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS jjals_ad AFTER DELETE ON jjals BEGIN
  INSERT INTO jjals_fts(jjals_fts, rowid, key, tags) VALUES('delete', old.id, old.key, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS jjals_au AFTER UPDATE ON jjals BEGIN
  INSERT INTO jjals_fts(jjals_fts, rowid, key, tags) VALUES('delete', old.id, old.key, old.tags);
  INSERT INTO jjals_fts(rowid, key, tags) VALUES (new.id, new.key, new.tags);
END;
