# HotPick 로컬 콘텐츠 DB

SQLite 기반 로컬 데이터베이스로 핫픽 콘텐츠와 짤 메타데이터를 관리합니다.

## 빠른 시작

```bash
# 1. DB 생성 + JSON 데이터 마이그레이션
npx tsx scripts/db/seed.ts

# 2. 핫픽 임베딩 생성 (유사도 검사용, ~2분)
npx tsx scripts/db/similarity.ts --generate

# 3. 중복 콘텐츠 검사
npx tsx scripts/db/similarity.ts --check-all
```

## npm scripts

| 명령어                     | 설명                                      |
| -------------------------- | ----------------------------------------- |
| `pnpm db:seed`             | JSON → SQLite 마이그레이션                |
| `pnpm db:embed`            | 핫픽 임베딩 생성 (119건, ~2분)            |
| `pnpm db:embed:all`        | 핫픽 + 짤 임베딩 생성 (10K건, ~30분)      |
| `pnpm db:check-duplicates` | 전체 핫픽 중복 검사                       |
| `pnpm db:upload`           | status='ready' 핫픽을 백엔드 API로 업로드 |

## DB 파일 위치

- **DB**: `data/hotpick.db` (.gitignore 대상, 로컬에서만 존재)
- **스키마**: `scripts/db/schema.sql`
- **소스 데이터**: `docs/contents/contents-mix.json`, `docs/contents/jjal-db.json`

DB가 없으면 `pnpm db:seed`로 다시 생성할 수 있습니다.

## 테이블 구조

```
categories (7건)         — love, marriage, relationship, finance, work, life, trend
hotpicks (119건)         — 핫픽 콘텐츠 (title, story, type, slug, options)
hotpick_categories       — 핫픽↔카테고리 다대다
jjals (10,015건)         — 짤 메타데이터 (key, url, tags)
hotpick_jjals            — 핫픽↔짤 매핑 (main_image, option_image_0, ...)
jjal_usage_log           — 짤 사용 이력 로그
jjals_fts                — 짤 태그 전문검색 (FTS5)
```

## 핫픽 상태 관리

```
draft → ready → uploaded
```

- `draft`: 작성 중 (기본값)
- `ready`: 검수 완료, 업로드 대기
- `uploaded`: 백엔드 API에 전송 완료

`pnpm db:upload` 실행 시 `ready` 상태인 핫픽만 업로드됩니다.

## 유사도 검사

로컬 임베딩 모델(`multilingual-e5-small`, 384차원)을 사용합니다. 첫 실행 시 모델(~118MB)을 자동 다운로드합니다.

```bash
# 새 콘텐츠 추가 전 중복 확인
npx tsx scripts/db/similarity.ts --check "연인이 전 애인 사진 안 지우면?"

# 전체 중복 검사 (threshold 92%)
npx tsx scripts/db/similarity.ts --check-all
```

## 짤 검색

FTS5 전문검색으로 태그 기반 짤 검색이 가능합니다.

```bash
# SQLite CLI로 직접 검색
sqlite3 data/hotpick.db "SELECT key, tags FROM jjals JOIN jjals_fts ON jjals.id = jjals_fts.rowid WHERE jjals_fts MATCH '웃긴' LIMIT 10;"
```

## 파일 구조

```
scripts/db/
├── README.md          ← 이 문서
├── schema.sql         — CREATE TABLE 문
├── index.ts           — DB 커넥션 싱글톤
├── seed.ts            — JSON → SQLite 마이그레이션
├── hotpicks.ts        — 핫픽 CRUD
├── jjals.ts           — 짤 CRUD + FTS + 사용 추적
└── similarity.ts      — 임베딩 생성 + 유사도 검사
```

## 코드에서 사용

```typescript
import { getDb, closeDb } from './scripts/db/index';
import { getHotpickById, getAllHotpicks, createHotpick } from './scripts/db/hotpicks';
import { searchJjalsByKeyword, linkJjalToHotpick } from './scripts/db/jjals';

// 핫픽 조회
const hotpick = getHotpickById(1);
const loveHotpicks = getAllHotpicks({ categorySlug: 'love' });

// 짤 FTS 검색
const jjals = searchJjalsByKeyword('웃긴');

// 짤을 핫픽에 연결
linkJjalToHotpick('10903', 1, 'main_image');

// 사용 후 DB 닫기
closeDb();
```
