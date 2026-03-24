'use client';

import { useCallback, useMemo, useState } from 'react';

import { m } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import ChartIcon from '@/assets/icon/ChartIcon';
import styles from '@/components/features/Hotpick/SingleDetailView/VoteTrendChart.module.scss';
import type { ElectionSeriesResponse } from '@/generated/models';
import type { GetElectionSeriesInterval } from '@/generated/models/getElectionSeriesInterval';
import { useElectionSeries } from '@/hooks/api/useElectionSeries';

/** 최소 포인트 수 — 이하일 경우 그래프 미표시 */
const MIN_POINTS = 2;

/** 옵션별 차트 색상 */
const CHART_COLORS = ['#ff00ff', '#ff4500', '#c8ff00', '#636ae8'];

/** 집계 간격 탭 — API interval 값과 1:1 매칭 */
const INTERVAL_TABS: { label: string; value: GetElectionSeriesInterval }[] = [
  { label: '5분', value: '5m' as GetElectionSeriesInterval },
  { label: '1시간', value: '1h' as GetElectionSeriesInterval },
  { label: '1일', value: '1d' as GetElectionSeriesInterval },
];

/** interval별 최대 포인트 수 (최근 N개만 표시) */
const MAX_POINTS_BY_INTERVAL: Record<string, number> = {
  '5m': 60, // 최근 5시간
  '1h': 72, // 최근 3일
  '1d': 30, // 최근 30일
};

interface VoteTrendChartProps {
  hotpickAlias: string;
  voted: boolean;
  isExpired: boolean;
}

/** UTC 문자열을 KST Date로 변환 (Z 없는 ISO 문자열 대응) */
function toKST(ts: string): Date {
  const raw = ts.endsWith('Z') || ts.includes('+') ? ts : `${ts}Z`;
  return new Date(new Date(raw).getTime() + 9 * 60 * 60 * 1000);
}

/** 시간 포맷 — interval에 따라 날짜 or 시각 표시 (KST) */
function formatTickByInterval(interval: string) {
  return (ts: string): string => {
    const d = toKST(ts);
    if (isNaN(d.getTime())) {
      return '--';
    }
    if (interval === '1d') {
      return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    }
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };
}

/** 날짜+시간 포맷 (tooltip 용, KST) */
function formatDateTime(ts: string): string {
  const d = toKST(ts);
  if (isNaN(d.getTime())) {
    return '--/-- --:--';
  }
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours().toString().padStart(2, '0');
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hour}:${min}`;
}

/** Recharts 데이터 포인트 */
interface ChartDataPoint {
  ts: string;
  [key: string]: string | number;
}

/**
 * Y축 정규화 — 공격적으로 줌인하여 작은 변동도 극대화
 * 실제 데이터 범위의 ±5% 패딩만 줌 → 화면 전체를 활용
 */
const Y_PADDING_RATIO = 0.05;
const MIN_Y_RANGE = 2;

function calcNormalizedDomain(allRates: number[]): [number, number] {
  if (allRates.length === 0) {
    return [0, 100];
  }

  const min = Math.min(...allRates);
  const max = Math.max(...allRates);
  const range = Math.max(max - min, MIN_Y_RANGE);
  const padding = range * Y_PADDING_RATIO;

  return [Math.max(0, Math.floor(min - padding)), Math.min(100, Math.ceil(max + padding))];
}

interface ChartBuildResult {
  data: ChartDataPoint[];
  itemKeys: string[];
  itemNames: string[];
  latestRates: number[];
  yDomain: [number, number];
}

function buildChartData(series: ElectionSeriesResponse, maxPoints?: number): ChartBuildResult {
  const items = series.items ?? [];
  if (items.length === 0) {
    return { data: [], itemKeys: [], itemNames: [], latestRates: [], yDomain: [0, 100] };
  }

  const itemKeys = items.map((_, i) => `rate${i}`);
  const itemNames = items.map((item) => item.title ?? `옵션 ${item.displayOrder}`);
  const allPoints = items[0]?.points ?? [];
  // 최근 N개만 슬라이스
  const basePoints =
    maxPoints && allPoints.length > maxPoints ? allPoints.slice(-maxPoints) : allPoints;
  const startIndex = allPoints.length - basePoints.length;

  const allRates: number[] = [];
  const data: ChartDataPoint[] = basePoints.map((pt, pi) => {
    const point: ChartDataPoint = { ts: pt.ts ?? '' };
    items.forEach((item, ii) => {
      const p = item.points?.[startIndex + pi];
      const rate = p?.voteRate ?? 0;
      point[itemKeys[ii]] = rate;
      allRates.push(rate);
    });
    return point;
  });

  const latestRates = items.map((item) => {
    const pts = item.points ?? [];
    return pts.length > 0 ? (pts[pts.length - 1].voteRate ?? 0) : 0;
  });

  return { data, itemKeys, itemNames, latestRates, yDomain: calcNormalizedDomain(allRates) };
}

/** Polymarket 스타일 Pill 툴팁 */
interface TooltipPayloadEntry {
  stroke: string;
  name: string;
  value?: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTime}>{formatDateTime(label ?? '')}</div>
      <div className={styles.tooltipPills}>
        {sorted.map((entry, i) => (
          <div
            key={i}
            className={styles.tooltipPill}
            style={{ backgroundColor: `${entry.stroke}22`, borderColor: `${entry.stroke}44` }}
          >
            <span className={styles.tooltipDot} style={{ background: entry.stroke }} />
            <span className={styles.pillName}>{entry.name}</span>
            <span className={styles.pillValue} style={{ color: entry.stroke }}>
              {entry.value?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 최신 포인트에 pulse 애니메이션 dot */
function PulseDot({
  cx,
  cy,
  index,
  totalPoints,
  color,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  totalPoints: number;
  color: string;
}) {
  if (cx === undefined || cy === undefined || index !== totalPoints - 1) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill={color} />
      <circle cx={cx} cy={cy} r={3} fill={color} className={styles.pulseDot} />
    </g>
  );
}

export const VoteTrendChart = ({ hotpickAlias, voted, isExpired }: VoteTrendChartProps) => {
  const [interval, setInterval] = useState<GetElectionSeriesInterval>(
    '1d' as GetElectionSeriesInterval
  );
  const { data: series, isLoading } = useElectionSeries(hotpickAlias, { interval });

  const showResult = voted || isExpired;

  const chartInfo = useMemo(() => {
    if (!series) {
      return null;
    }
    return buildChartData(series, MAX_POINTS_BY_INTERVAL[interval]);
  }, [series, interval]);

  const handleTabClick = useCallback((value: GetElectionSeriesInterval) => {
    setInterval(value);
  }, []);

  const pointCount = series?.items?.[0]?.points?.length ?? 0;
  const hasEnoughData = !isLoading && !!chartInfo && pointCount >= MIN_POINTS;

  const { data, itemKeys, itemNames, latestRates, yDomain } = chartInfo ?? {
    data: [],
    itemKeys: [],
    itemNames: [],
    latestRates: [],
    yDomain: [0, 100] as [number, number],
  };

  return (
    <m.div
      className={styles.chartSection}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 헤더 */}
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>투표 추이</h3>
      </div>

      {hasEnoughData ? (
        <>
          {/* 범례 — Polymarket 스타일: 차트 위에 가로 배치 */}
          {showResult && (
            <div className={styles.legend}>
              {itemNames.map((name, i) => (
                <div key={i} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className={styles.legendLabel}>{name}</span>
                  <span
                    className={styles.legendRate}
                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {latestRates[i]?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 차트 영역 */}
          <div className={styles.chartWrapper}>
            {!showResult && (
              <div className={styles.blurOverlay}>
                <ChartIcon width={28} height={28} className={styles.blurIcon} />
                <span className={styles.blurText}>투표하면 실시간 추이를 확인할 수 있어요</span>
              </div>
            )}

            <div className={showResult ? styles.chartVisible : styles.chartBlurred}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                  <defs>
                    {itemKeys.map((key, i) => {
                      const color = CHART_COLORS[i % CHART_COLORS.length];
                      return (
                        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  <CartesianGrid
                    strokeDasharray="1 4"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="ts"
                    tickFormatter={formatTickByInterval(interval)}
                    stroke="transparent"
                    tick={{ fontSize: 11, fill: '#8a8a8a' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />

                  <YAxis
                    orientation="right"
                    domain={yDomain}
                    stroke="transparent"
                    tick={{ fontSize: 11, fill: '#8a8a8a' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    width={38}
                    tickCount={5}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    isAnimationActive={false}
                    cursor={{
                      stroke: 'rgba(255,255,255,0.15)',
                      strokeWidth: 1.5,
                    }}
                  />

                  {itemKeys.map((key, i) => {
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={itemNames[i]}
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#grad-${key})`}
                        dot={(props) => (
                          <PulseDot {...props} totalPoints={data.length} color={color} />
                        )}
                        activeDot={{
                          r: 4,
                          stroke: color,
                          strokeWidth: 2,
                          fill: '#1e1e1e',
                        }}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 하단: 참여자 수 + 시간 범위 탭 */}
          {showResult && (
            <div className={styles.chartFooter}>
              <div className={styles.totalVotes}>
                {series?.totalVoteCount?.toLocaleString()}명 참여
              </div>
              <div className={styles.timeTabs} role="tablist">
                {INTERVAL_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={interval === tab.value}
                    className={`${styles.timeTab} ${interval === tab.value ? styles.timeTabActive : ''}`}
                    onClick={() => handleTabClick(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <ChartIcon width={28} height={28} className={styles.blurIcon} />
          <span className={styles.emptyText}>
            {isLoading
              ? '추이 데이터를 불러오는 중...'
              : '아직 데이터가 부족하여 추이를 표시할 수 없어요'}
          </span>
        </div>
      )}
    </m.div>
  );
};
