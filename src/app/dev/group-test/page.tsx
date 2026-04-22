'use client';

import Link from 'next/link';

const TEST_GROUPS = [
  { token: 'group-abc', label: '5명 (마케팅팀)', members: 5, description: '기본 테스트 그룹' },
  {
    token: 'group-10',
    label: '10명 (동아리)',
    members: 10,
    description: '네트워크 그래프 한계 근접',
  },
  {
    token: 'group-20',
    label: '20명 (대학 동기)',
    members: 20,
    description: '케미 랭킹 전환 테스트',
  },
  { token: 'group-50', label: '50명 (회사 전체)', members: 50, description: '최대 인원 테스트' },
  { token: 'group-empty', label: '1명 (디자인팀)', members: 1, description: '대기 상태 테스트' },
  { token: 'group-new', label: '0명 (신규 그룹)', members: 0, description: '빈 그룹 테스트' },
];

const EXTERNAL_MOCKS = [
  {
    href: '/dev/group-mock-15',
    label: '15명 남8여7 (BE 응답 mock)',
    description: '네트워크 그래프 홀수 인원',
  },
  {
    href: '/dev/group-mock-16',
    label: '16명 남녀 8:8 (BE 응답 mock)',
    description: '케미 랭킹 전환 경계',
  },
  {
    href: '/dev/group-mock-40',
    label: '40명 남녀 20:20 (BE 응답 mock)',
    description: '대인원 케미 랭킹',
  },
];

export default function GroupTestPage() {
  return (
    <div style={{ padding: '24px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        그룹 결과 테스트
      </h1>
      <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 24 }}>
        인원수별 UI 스케일링 테스트용 페이지
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TEST_GROUPS.map((g) => (
          <Link
            key={g.token}
            href={`/compare/group/${g.token}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: 'rgba(30, 30, 30, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: '#8a8a8a', marginTop: 2 }}>{g.description}</div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#8a8a8a',
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              {g.members}명 →
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {EXTERNAL_MOCKS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: 'rgba(30, 30, 30, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: '#8a8a8a', marginTop: 2 }}>{m.description}</div>
            </div>
            <div style={{ fontSize: 12, color: '#8a8a8a', flexShrink: 0, marginLeft: 12 }}>
              열기 →
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: 'rgba(30, 30, 30, 0.4)',
          borderRadius: 12,
          fontSize: 12,
          color: '#8a8a8a',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#d1d1d1' }}>UI 전환 기준</strong>
        <br />
        • 케미 네트워크 → 케미 랭킹: 16명 이상
        <br />
        • (예정) 논쟁 투표 아바타 스택: 9명 이상
        <br />
        • (예정) 가치관 지도 닉네임 숨김: 11명 이상
        <br />• (예정) 멤버 리스트 접기: 11명 이상
      </div>
    </div>
  );
}
