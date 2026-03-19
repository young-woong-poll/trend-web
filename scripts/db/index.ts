import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

const DB_PATH = path.join(__dirname, '../../data/hotpick.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  // PRAGMA 문은 이미 getDb()에서 설정했으므로 제거 후 전체 실행
  // db.exec()는 여러 SQL 문을 한번에 실행할 수 있으므로
  // CREATE TRIGGER 내부 세미콜론도 문제 없음
  const withoutPragma = schema
    .split('\n')
    .filter((line) => !line.trim().startsWith('PRAGMA'))
    .join('\n');
  db.exec(withoutPragma);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
