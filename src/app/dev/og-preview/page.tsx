/**
 * OG 디자인 프로토타입 프리뷰
 *
 * 12개 variant (Bundle 3, Compare PENDING 3, MATCH 3, GROUP 3)을
 * 실시간 생성 이미지로 비교합니다. 하단 컨트롤에서 카테고리/matchRate/memberCount/grade
 * 변경해 다양한 조합을 체크할 수 있습니다.
 */
'use client';

import { useMemo, useState } from 'react';

import type { ChemistryGrade } from '@/constants/bundle';
import type { CategoryCode } from '@/types/hotpick';

const CATEGORIES: { code: CategoryCode; label: string }[] = [
  { code: 'LOVE', label: '연애' },
  { code: 'MARRIAGE', label: '결혼' },
  { code: 'FINANCE', label: '재테크' },
  { code: 'WORK', label: '직장' },
  { code: 'SPORTS', label: '스포츠' },
  { code: 'FOOD', label: '음식' },
  { code: 'GAME', label: '게임' },
  { code: 'CAR', label: '자동차' },
  { code: 'HEALTH', label: '건강' },
  { code: 'TREND', label: '트렌드' },
];

const GRADES: ChemistryGrade[] = ['SS', 'S', 'A', 'B', 'C', 'D', 'X'];
const DESIGNS = ['v1', 'v2', 'v3'] as const;
const MATCH_RATES = [100, 85, 70, 50, 30, 10, 0];
const MEMBER_COUNTS = [1, 3, 6, 10, 20, 50];

function buildBundleUrl(params: {
  design: string;
  category: string;
  participants: number;
  questions: number;
  bundleTitle?: string;
}) {
  const q = new URLSearchParams({
    design: params.design,
    category: params.category,
    participants: String(params.participants),
    questions: String(params.questions),
  });
  if (params.bundleTitle) {
    q.set('bundleTitle', params.bundleTitle);
  }
  return `/api/og/bundle?${q.toString()}`;
}

function buildCompareUrl(params: {
  design: string;
  category: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  status?: 'PENDING' | 'DONE';
  grade?: string;
  matchRate?: number;
  memberCount?: number;
  groupName?: string;
  bundleTitle?: string;
  creatorName?: string;
}) {
  const q = new URLSearchParams({
    design: params.design,
    category: params.category,
    type: params.type,
  });
  if (params.status) {
    q.set('status', params.status);
  }
  if (params.grade) {
    q.set('grade', params.grade);
  }
  if (params.matchRate !== undefined) {
    q.set('matchRate', String(params.matchRate));
  }
  if (params.memberCount !== undefined) {
    q.set('memberCount', String(params.memberCount));
  }
  if (params.groupName) {
    q.set('groupName', params.groupName);
  }
  if (params.bundleTitle) {
    q.set('bundleTitle', params.bundleTitle);
  }
  if (params.creatorName) {
    q.set('creatorName', params.creatorName);
  }
  return `/api/og/compare?${q.toString()}`;
}

function VariantCard({ title, url, ratio = 0.4 }: { title: string; url: string; ratio?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        background: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#ff00ff', fontSize: 12, fontWeight: 400 }}
        >
          원본 ↗
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={title}
        width={1200 * ratio}
        height={630 * ratio}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1200 / 630',
          objectFit: 'cover',
          borderRadius: 8,
          background: '#000',
        }}
      />
      {/* 카톡 썸네일 크기 시뮬레이션 (344×165px) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${title} - 카톡 크기`}
        width={344}
        height={164}
        style={{
          width: 344,
          height: 164,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid #555',
          alignSelf: 'flex-start',
        }}
      />
      <div style={{ color: '#888', fontSize: 11 }}>↑ 카톡 썸네일 실제 크기 (344×164)</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>{title}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function OgPreviewPage() {
  const [category, setCategory] = useState<CategoryCode>('LOVE');
  const [participants, setParticipants] = useState(12000);
  const [questions, setQuestions] = useState(10);
  const [grade, setGrade] = useState<ChemistryGrade>('A');
  const [matchRate, setMatchRate] = useState(75);
  const [memberCount, setMemberCount] = useState(6);
  const [groupName, setGroupName] = useState('금융F2');
  const [bundleTitle, setBundleTitle] = useState('우리 연애 케미, 통할까?');
  const [creatorName, setCreatorName] = useState('지훈');

  const bundleUrls = useMemo(
    () =>
      DESIGNS.map((design) => ({
        design,
        url: buildBundleUrl({ design, category, participants, questions, bundleTitle }),
      })),
    [category, participants, questions, bundleTitle]
  );

  // PENDING도 V2로 확정 — 단일 URL
  const pendingUrl = useMemo(
    () =>
      buildCompareUrl({
        design: 'v2',
        category,
        type: 'ONE_TO_ONE',
        status: 'PENDING',
        bundleTitle,
        creatorName,
      }),
    [category, bundleTitle, creatorName]
  );

  // MATCH/GROUP은 V2로 확정 — 단일 URL만 생성
  const matchUrl = useMemo(
    () =>
      buildCompareUrl({
        design: 'v2',
        category,
        type: 'ONE_TO_ONE',
        status: 'DONE',
        grade,
        matchRate,
      }),
    [category, grade, matchRate]
  );

  const groupUrl = useMemo(
    () =>
      buildCompareUrl({
        design: 'v2',
        category,
        type: 'GROUP',
        memberCount,
        groupName,
        bundleTitle,
      }),
    [category, memberCount, groupName, bundleTitle]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#121212',
        color: '#fff',
        padding: '32px 24px 160px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>OG Preview</h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
          Bundle / Compare OG 프로토타입 12종 · Placeholder 영역은 B 이미지 제작 예정 자리입니다.
        </p>
      </header>

      <Section
        title={`🎯 Bundle — 테스트 추천 (${participants.toLocaleString()}명 · ${questions}문항)`}
      >
        {bundleUrls.map(({ design, url }) => (
          <VariantCard key={design} title={`Bundle ${design.toUpperCase()}`} url={url} />
        ))}
      </Section>

      <Section title="⚔️ Compare ONE_TO_ONE · PENDING — 신청 링크 · V2 확정">
        <VariantCard title="PENDING V2 (Challenge Letter)" url={pendingUrl} />
      </Section>

      <Section
        title={`🏆 Compare ONE_TO_ONE · DONE/MATCH — 결과 공유 (${grade}등급 · ${matchRate}%) · V2 확정`}
      >
        <VariantCard title="MATCH V2 (Certificate)" url={matchUrl} />
      </Section>

      <Section title={`👥 Compare GROUP — 그룹 초대 (${memberCount}명 · ${groupName}) · V2 확정`}>
        <VariantCard title="GROUP V2 (편지/초대장)" url={groupUrl} />
      </Section>

      {/* 하단 고정 컨트롤 */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          borderTop: '1px solid #333',
          padding: '16px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <Field label="카테고리">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryCode)}
            style={selectStyle}
          >
            {CATEGORIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label} ({code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="참여자수 (Bundle)">
          <input
            type="number"
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>
        <Field label="문항수 (Bundle)">
          <input
            type="number"
            value={questions}
            onChange={(e) => setQuestions(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>
        <Field label="등급 (MATCH)">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as ChemistryGrade)}
            style={selectStyle}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="매치율 (MATCH)">
          <select
            value={matchRate}
            onChange={(e) => setMatchRate(Number(e.target.value))}
            style={selectStyle}
          >
            {MATCH_RATES.map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </Field>
        <Field label="멤버수 (GROUP)">
          <select
            value={memberCount}
            onChange={(e) => setMemberCount(Number(e.target.value))}
            style={selectStyle}
          >
            {MEMBER_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}명
              </option>
            ))}
          </select>
        </Field>
        <Field label="팀 이름 (GROUP)">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="금융F2"
            maxLength={20}
            style={inputStyle}
          />
        </Field>
        <Field label="번들 타이틀 (PENDING V2)">
          <input
            type="text"
            value={bundleTitle}
            onChange={(e) => setBundleTitle(e.target.value)}
            placeholder="우리 연애 케미"
            maxLength={40}
            style={{ ...inputStyle, width: 220 }}
          />
        </Field>
        <Field label="보낸사람 (PENDING V2)">
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="지훈"
            maxLength={20}
            style={inputStyle}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#fff', fontSize: 11 }}
    >
      <span style={{ color: '#888' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#2c2c2c',
  color: '#fff',
  border: '1px solid #3a3a3a',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
  width: 110,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: 150,
};
