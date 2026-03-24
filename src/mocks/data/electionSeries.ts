import type { ElectionSeriesResponse } from '@/generated/models';

/**
 * 시계열 Mock 데이터 생성 유틸
 * - slug 기반 시드로 결정론적 데이터 생성
 * - interval 파라미터에 따라 포인트 간격/개수 조절
 */

const now = new Date();

function timeAgo(ms: number): string {
  return new Date(now.getTime() - ms).toISOString();
}

/** interval별 설정: 포인트 수, 포인트 간 ms 간격 */
const INTERVAL_CONFIG: Record<string, { points: number; stepMs: number; label: string }> = {
  '1h': { points: 12, stepMs: 5 * 60 * 1000, label: '1h' }, // 12포인트 × 5분 = 1시간
  '1d': { points: 24, stepMs: 60 * 60 * 1000, label: '1d' }, // 24포인트 × 1시간 = 1일
  all: { points: 30, stepMs: 24 * 60 * 60 * 1000, label: 'all' }, // 30포인트 × 1일 = 약 1달
};

/**
 * 간단한 시드 기반 의사 난수 생성기 (결정론적)
 * 동일 slug → 동일 차트 형태
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return (s >>> 0) / 0x7fffffff;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * N개 옵션 범용 시계열 생성 — interval 기반
 */
function generateNOptionSeries(
  electionId: string,
  items: { id: string; title: string }[],
  slug: string,
  interval: string
): ElectionSeriesResponse {
  const config = INTERVAL_CONFIG[interval] ?? INTERVAL_CONFIG['1d'];
  const totalPoints = config.points;
  const n = items.length;
  // interval도 시드에 포함하여 탭별로 다른 패턴 생성
  const rand = seededRandom(hashString(slug + interval));

  const baseCounts = [30, 25, 20, 15];
  const maxIncrements = [15, 12, 10, 8];

  const cumulative: number[] = items.map((_, i) => (baseCounts[i] ?? 20) + Math.floor(rand() * 20));
  const pointsArr: { ts: string; voteCount: number; voteRate: number }[][] = items.map(() => []);

  for (let t = totalPoints - 1; t >= 0; t--) {
    const ts = timeAgo(t * config.stepMs);

    for (let i = 0; i < n; i++) {
      const maxInc = maxIncrements[i] ?? 8;
      cumulative[i] += Math.floor(rand() * maxInc) + 2;
    }

    const total = cumulative.reduce((sum, c) => sum + c, 0);

    for (let i = 0; i < n; i++) {
      pointsArr[i].push({
        ts,
        voteCount: cumulative[i],
        voteRate: Math.round((cumulative[i] / total) * 10000) / 100,
      });
    }
  }

  const totalVoteCount = cumulative.reduce((sum, c) => sum + c, 0);

  return {
    hotpickId: 1,
    hotpickSlug: slug,
    electionId: parseInt(electionId.replace(/\D/g, ''), 10) || 1,
    interval: config.label,
    openedAt: timeAgo(totalPoints * config.stepMs),
    totalVoteCount,
    items: items.map((item, idx) => ({
      electionItemId: parseInt(item.id.replace(/\D/g, ''), 10) || idx + 1,
      displayOrder: idx + 1,
      title: item.title,
      points: pointsArr[idx],
    })),
  };
}

/**
 * 데이터가 적은 케이스 (3개 포인트 — 그래프 미표시 테스트용)
 */
function generateFewPointsSeries(
  electionId: string,
  items: { id: string; title: string }[]
): ElectionSeriesResponse {
  return {
    hotpickId: 1,
    hotpickSlug: '',
    electionId: parseInt(electionId.replace(/\D/g, ''), 10) || 1,
    interval: '1h',
    openedAt: timeAgo(3 * 60 * 60 * 1000),
    totalVoteCount: 30,
    items: items.map((item, idx) => ({
      electionItemId: parseInt(item.id.replace(/\D/g, ''), 10) || idx + 1,
      displayOrder: idx + 1,
      title: item.title,
      points: [
        {
          ts: timeAgo(2 * 60 * 60 * 1000),
          voteCount: 5 + idx * 3,
          voteRate: idx === 0 ? 62.5 : 37.5,
        },
        { ts: timeAgo(1 * 60 * 60 * 1000), voteCount: 8 + idx * 4, voteRate: idx === 0 ? 60 : 40 },
        { ts: timeAgo(0), voteCount: 12 + idx * 3, voteRate: idx === 0 ? 57 : 43 },
      ],
    })),
  };
}

/**
 * slug → 시계열 mock 데이터 매핑
 * singleVoteDataMap 기반으로 동적 생성 (시드 기반 결정론적)
 */
export function getMockElectionSeries(
  slug: string,
  voteData: { electionId: string; options: { id: string; text: string }[] } | undefined,
  interval = '1d'
): ElectionSeriesResponse | null {
  if (!voteData) {
    return null;
  }

  const items = voteData.options.map((o) => ({ id: o.id, title: o.text }));

  // 특정 slug는 데이터가 적은 케이스 (그래프 미표시)
  if (slug === 'single-sports-urgent') {
    return generateFewPointsSeries(voteData.electionId, items);
  }

  return generateNOptionSeries(voteData.electionId, items, slug, interval);
}
