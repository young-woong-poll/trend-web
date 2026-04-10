'use client';

import Link from 'next/link';

const SCENARIOS = [
  {
    token: 'guest-loggedout',
    label: '비멤버 + 비로그인',
    description: '로그인하지 않은 유저가 그룹 결과를 볼 때',
    detail: '"나도 참여하기" → 로그인 유도',
  },
  {
    token: 'guest-no-bundle',
    label: '비멤버 + 번들 미완료',
    description: '로그인했지만 해당 번들을 아직 안 푼 유저',
    detail: '"나도 참여하기" → 번들 풀기로 이동',
  },
  {
    token: 'guest-completed',
    label: '비멤버 + 번들 완료',
    description: '로그인하고 번들도 풀었지만 이 그룹에 참여 안 한 유저',
    detail: '"나도 참여하기" → displayName 입력 → 참여',
  },
];

export default function GroupGuestTestPage() {
  return (
    <div style={{ padding: '24px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        그룹 비멤버 시나리오 테스트
      </h1>
      <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 24 }}>
        각 시나리오에서 하단 FloatingCta 동작을 확인하세요
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCENARIOS.map((s) => (
          <Link
            key={s.token}
            href={`/compare/group/${s.token}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '16px',
              background: 'rgba(30, 30, 30, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: '#d1d1d1' }}>{s.description}</div>
            <div style={{ fontSize: 12, color: '#8a8a8a', marginTop: 4 }}>{s.detail}</div>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(30, 30, 30, 0.4)',
          borderRadius: 12,
          fontSize: 12,
          color: '#8a8a8a',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#d1d1d1' }}>참고</strong>
        <br />• 비로그인: MSW에서 anonymous로 처리 (isCreator/isParticipant = false,
        myBundleCompleted = false)
        <br />• 번들 미완료: marriage-values 번들 (mock-user-1이 안 푼 상태)
        <br />• 번들 완료: love-values 번들 (mock-user-1이 이미 푼 상태)
        <br />• 3개 그룹 모두 mock-user-3이 방장, mock-user-1은 비멤버
      </div>
    </div>
  );
}
