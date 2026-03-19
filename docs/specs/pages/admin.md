# 관리자 페이지 (`/admin/*`)

> 최종 업데이트: 2026-03-01

## 개요

개발환경 전용 관리자 페이지. 핫픽/카테고리 CRUD 및 이미지 업로드.

---

## 1. 페이지 구성

| 페이지    | 경로                       | 설명                        |
| --------- | -------------------------- | --------------------------- |
| 핫픽 목록 | `/admin/hotpick`           | 핫픽 목록 조회/삭제         |
| 핫픽 생성 | `/admin/hotpick/create`    | 핫픽 생성 (SINGLE만 활성화) |
| 핫픽 수정 | `/admin/hotpick/edit/{id}` | 핫픽 수정                   |
| 카테고리  | `/admin/category`          | 카테고리 CRUD (인라인 편집) |

---

## 2. 핫픽 관리

- **목록**: 썸네일, 제목, 슬러그, 상태(만료 여부), 생성일, 수정/삭제 액션
- **생성**: 타입(SINGLE만 활성), 슬러그(중복확인), 카테고리(복수 선택), 마감일, 공개여부, 투표 구성
- **수정**: 슬러그 외 모든 필드 수정 가능
- **삭제**: 확인 모달 후 삭제

---

## 3. 카테고리 관리

- 인라인 CRUD (별도 모달 없음)
- 필드: 이름(name), 슬러그(slug)
- 슬러그: 영숫자 + 언더스코어 + 하이픈

---

## 4. 이미지 업로드

- S3 presigned URL 방식 (`GET /admin/api/v1/storage/presigned?filename=...`)
- 파일을 S3에 직접 업로드 -> CDN URL을 폼 데이터에 저장

---

## API 요약

| Method | Endpoint                            | 설명             |
| ------ | ----------------------------------- | ---------------- |
| GET    | `/admin/api/v1/hotpicks`            | 핫픽 목록        |
| POST   | `/admin/api/v1/hotpicks`            | 핫픽 생성        |
| GET    | `/admin/api/v1/hotpicks/{id}`       | 핫픽 상세        |
| PUT    | `/admin/api/v1/hotpicks/{id}`       | 핫픽 수정        |
| DELETE | `/admin/api/v1/hotpicks/{id}`       | 핫픽 삭제        |
| GET    | `/admin/api/v1/hotpicks/check-slug` | 슬러그 중복 확인 |
| GET    | `/admin/api/v1/categories`          | 카테고리 목록    |
| POST   | `/admin/api/v1/categories`          | 카테고리 생성    |
| PUT    | `/admin/api/v1/categories/{id}`     | 카테고리 수정    |
| DELETE | `/admin/api/v1/categories/{id}`     | 카테고리 삭제    |
| GET    | `/admin/api/v1/storage/presigned`   | S3 업로드 URL    |

## Changelog

- 2026-03-01: 초기 작성 (00-overview.md에서 분리)
