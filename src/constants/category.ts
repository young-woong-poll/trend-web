export interface CategoryFilterItem {
  label: string;
  slug: string;
}

/**
 * 탭에 노출할 카테고리 슬러그 화이트리스트.
 * 운영 DB나 BE 응답이 어떻든, 이 목록에 있는 슬러그만 탭에 표시된다.
 * 직접 URL 진입(/?category=love 등)은 여전히 동작하므로 SEO·롱테일 검색 유입은 보존된다.
 *
 * 정책 변경 이력은 docs/strategy/2026-05-03-content-niche-pivot.md 참조.
 */
export const VISIBLE_CATEGORY_SLUGS: readonly string[] = ['dating', 'nuisance'];

/** 카테고리 폴백 목록 (API 응답 전 또는 실패 시 사용) */
export const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { label: '소개팅', slug: 'dating' },
  { label: '민폐 논란', slug: 'nuisance' },
  { label: '연애', slug: 'love' },
  { label: '결혼', slug: 'marriage' },
  { label: '관계', slug: 'relationship' },
  { label: '재테크', slug: 'finance' },
  { label: '직장', slug: 'work' },
  { label: '라이프', slug: 'life' },
  { label: '트렌드', slug: 'trend' },
];
