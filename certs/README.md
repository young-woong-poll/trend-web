# HTTPS 개발 서버 설정

## 사용 방법

### HTTPS 개발 서버 실행

#### 방법 1: 포트 443 사용

```bash
sudo pnpm dev:https
```

이 명령어는:

1. Next.js를 3002 포트에서 실행
2. local-ssl-proxy가 **443 포트**에서 HTTPS로 프록시
3. **sudo 권한 필요** (443은 privileged port)

브라우저에서 접속:

- **추천**: https://local-trend.votebox.kr

### 포트 443 사용 시

```
브라우저 (HTTPS 요청)
    ↓
https://local-trend.votebox.kr (local-ssl-proxy on port 443)
    ↓
http://localhost:3002 (Next.js dev server)
```

## 처음 설정하는 경우 (새로운 개발자)

### 1. mkcert 설치

macOS:

```bash
brew install mkcert
brew install nss # Firefox 지원용
```

### 2. 로컬 CA 설치

```bash
mkcert -install
```

### 3. \*.votebox.kr 인증서 생성

```bash
# 프로젝트 루트에서 실행
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem "*.votebox.kr" localhost 127.0.0.1 ::1
```

### 4. /etc/hosts 파일 수정

```bash
sudo nano /etc/hosts
```

아래 라인 추가:

```
127.0.0.1 local-trend.votebox.kr
```

저장: `Ctrl+X` → `Y` → `Enter`

## 문제 해결

### "인증서를 신뢰할 수 없습니다" 에러

```bash
mkcert -install
```

### 브라우저가 연결을 거부합니다

1. 개발 서버가 실행 중인지 확인: `pnpm dev:https`
2. 포트가 이미 사용 중인지 확인: `lsof -i :3000` 또는 `lsof -i :3002`
3. 필요시 프로세스 종료: `kill -9 <PID>`

### hosts 파일이 적용되지 않습니다

DNS 캐시 플러시:

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## 주의사항

- `certs/` 폴더는 `.gitignore`에 추가되어 있어 Git에 커밋되지 않습니다
- `*.pem` 파일은 절대 공유하거나 커밋하지 마세요
- 각 개발자는 자신의 로컬 환경에서 인증서를 생성해야 합니다
- 인증서는 3년간 유효합니다 (2028년 3월 5일까지)
