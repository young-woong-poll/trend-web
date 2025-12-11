# HotPick (핫픽) - Trend Web

이번 주 대한민국은 이걸로 싸운다 🔥

## HTTPS 개발환경 설정

로컬에서 HTTPS로 개발하기 위한 설정 가이드입니다.

### 1. 사전 준비

#### 필수 도구 설치

```bash
# Node.js 18+ 설치 확인
node --version

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install
```

#### mkcert 설치 (로컬 SSL 인증서 생성 도구)

**macOS:**

```bash
brew install mkcert
brew install nss # Firefox 사용자는 필요
```

**Windows (Chocolatey):**

```bash
choco install mkcert
```

**Linux:**

```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

### 2. SSL 인증서 생성

```bash
# mkcert 로컬 CA 설치 (최초 1회만)
mkcert -install

# 프로젝트 루트에 certs 디렉토리 생성
mkdir -p certs

# local-trend.votebox.kr 도메인용 인증서 생성
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem local-trend.votebox.kr localhost 127.0.0.1 ::1
```

### 3. hosts 파일 수정

로컬 도메인을 127.0.0.1로 매핑합니다.

#### macOS / Linux

```bash
# hosts 파일 편집
sudo vim /etc/hosts

# 또는
sudo nano /etc/hosts
```

아래 내용 추가:

```
127.0.0.1 local-trend.votebox.kr
```

#### Windows

1. 관리자 권한으로 메모장 실행
2. `C:\Windows\System32\drivers\etc\hosts` 파일 열기
3. 아래 내용 추가:

```
127.0.0.1 local-trend.votebox.kr
```

#### 확인

```bash
# 도메인이 제대로 매핑되었는지 확인
ping local-trend.votebox.kr
# 127.0.0.1로 응답하면 성공
```

### 4. 개발 서버 실행

```bash
# HTTPS 개발 서버 실행
pnpm dev:https
```

브라우저에서 접속:

- **HTTPS**: https://local-trend.votebox.kr
- **HTTP (일반)**: http://localhost:3002

> **참고**: `pnpm dev:https` 명령어는 다음 작업을 수행합니다:
>
> - Next.js를 3002 포트에서 실행
> - local-ssl-proxy로 443 포트 → 3002 포트 프록시
> - SSL 인증서를 사용하여 HTTPS 제공

### 5. 일반 HTTP 개발

HTTPS가 필요 없는 경우:

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속

## 기타 명령어

### 빌드 및 실행

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

### 코드 품질 관리

```bash
# Lint 검사
pnpm lint

# Lint 자동 수정
pnpm lint:fix

# 포맷 검사
pnpm format:check

# 포맷 자동 적용
pnpm format

# 타입 체크
pnpm type-check
```

## 문제 해결

### "Address already in use" 에러

443 포트가 이미 사용 중인 경우:

```bash
# macOS/Linux
sudo lsof -i :443
sudo kill -9 [PID]

# Windows (PowerShell - 관리자 권한)
netstat -ano | findstr :443
taskkill /PID [PID] /F
```

### mkcert 인증서 오류

```bash
# mkcert 재설치
mkcert -uninstall
mkcert -install

# 인증서 재생성
rm -rf certs
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem local-trend.votebox.kr localhost 127.0.0.1 ::1
```

### hosts 파일 수정이 반영되지 않는 경우

```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows (PowerShell - 관리자 권한)
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

## 기술 스택

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: SCSS (Sass)
- **State Management**: TanStack Query (React Query)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Package Manager**: pnpm
- **Git Hooks**: Lefthook
