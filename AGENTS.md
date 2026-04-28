# AGENTS.md

GA4 트래킹은 환경별로 분리됨 (Real/Beta는 Vercel `NEXT_PUBLIC_GA_ID`, Local 미로드).
이벤트 헬퍼는 [src/lib/analytics.ts](src/lib/analytics.ts), 호출 사이트는 각 feature 컴포넌트.
GA4 콘솔 등록(맞춤 측정기준·핵심 이벤트), 보고서 만드는 법, KPI는 [docs/ga4.md](docs/ga4.md) 참고.
