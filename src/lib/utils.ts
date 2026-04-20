/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility function to format date
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nickname validation constants and functions
 */
export const NICKNAME_MAX_LENGTH = 10;
export const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s._-]*$/;

export interface NicknameValidationResult {
  isValid: boolean;
  error?: string;
  trimmedValue: string;
}

/**
 * Validate nickname
 * - Allowed: English, Korean, spaces, numbers, -_.
 * - Max length: 10 characters
 * - Automatically trims whitespace
 */
export function validateNickname(value: string): NicknameValidationResult {
  const trimmedValue = value.trim();

  // Check if empty
  if (!trimmedValue) {
    return {
      isValid: false,
      error: '닉네임을 입력해주세요',
      trimmedValue,
    };
  }

  // Check length
  if (trimmedValue.length > NICKNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 입력 가능합니다`,
      trimmedValue,
    };
  }

  // Check allowed characters
  if (!NICKNAME_REGEX.test(trimmedValue)) {
    return {
      isValid: false,
      error: '영어, 한글, 숫자, 공백, -_. 만 입력 가능합니다',
      trimmedValue,
    };
  }

  return {
    isValid: true,
    trimmedValue,
  };
}

/**
 * Check if nickname contains only valid characters (without trimming)
 * Used for real-time input validation
 */
export function isValidNicknameCharacters(value: string): boolean {
  return NICKNAME_REGEX.test(value);
}

/**
 * Generate a random Korean nickname (형용사 + 명사)
 * Always within NICKNAME_MAX_LENGTH (10 chars)
 */
const NICKNAME_ADJECTIVES = [
  // 형용사 — 성격/감정
  '용감한',
  '빠른',
  '귀여운',
  '멋진',
  '똑똑한',
  '행복한',
  '신나는',
  '느긋한',
  '활발한',
  '조용한',
  '씩씩한',
  '다정한',
  '엉뚱한',
  '솔직한',
  '당당한',
  '유쾌한',
  '깜찍한',
  '든든한',
  '화려한',
  '소심한',
  '따뜻한',
  '냉정한',
  '순수한',
  '영리한',
  '겸손한',
  '대담한',
  '잔잔한',
  '힘찬',
  '고요한',
  '쾌활한',
  '청량한',
  '포근한',
  '강인한',
  '천진한',
  '반짝인',
  '단단한',
  '야무진',
  '유연한',
  '진지한',
  '거친',
  '기특한',
  '꿋꿋한',
  '정직한',
  '태연한',
  '호기심',
  // 형용사 — 느낌/분위기
  '싱그런',
  '서늘한',
  '투명한',
  '고운',
  '무던한',
  '담백한',
  '깔끔한',
  '푸른',
  '붉은',
  '하얀',
  '까만',
  '노란',
  '은은한',
  '선명한',
  '묵직한',
  '가벼운',
  '부드런',
  '날카룬',
  '새침한',
  '명랑한',
  '느린',
  '긴',
  '작은',
  '큰',
  '깊은',
  '넓은',
  '높은',
  '짧은',
  '둥근',
  '뾰족한',
  '반듯한',
  '산뜻한',
  '화난',
  '졸린',
  '배고픈',
  '심심한',
  '설렌',
  '든든한',
  '아늑한',
  '쿨한',
  '힙한',
  '찬란한',
  '눈부신',
  '고독한',
  '자유로운',
  '평화로운',
  '낭만의',
  '열정의',
  '지혜로운',
  '상냥한',
  // 동사형
  '달리는',
  '웃는',
  '춤추는',
  '꿈꾸는',
  '노래한',
  '날아간',
  '헤엄친',
  '빛나는',
  '도전한',
  '탐험한',
  '뛰노는',
  '잠든',
  '깨어난',
  '구르는',
  '외치는',
  '속삭인',
  '나르는',
  '걷는',
  '쉬는',
  '보는',
]; // 113개

const NICKNAME_NOUNS = [
  // 포유류
  '호랑이',
  '고양이',
  '강아지',
  '토끼',
  '판다',
  '수달',
  '다람쥐',
  '여우',
  '사자',
  '코끼리',
  '햄스터',
  '미어캣',
  '알파카',
  '거북이',
  '고슴도치',
  '흑표범',
  '북극곰',
  '늑대',
  '치타',
  '코알라',
  '캥거루',
  '삵',
  '담비',
  '오소리',
  '족제비',
  '기린',
  '하마',
  '코뿔소',
  '얼룩말',
  '조랑말',
  '너구리',
  '고라니',
  '산양',
  '사슴',
  '물개',
  '해달',
  '비버',
  '두더지',
  '청설모',
  '원숭이',
  '침팬지',
  '고릴라',
  '나무늘보',
  '라쿤',
  '스컹크',
  // 조류
  '펭귄',
  '올빼미',
  '앵무새',
  '두루미',
  '까마귀',
  '참새',
  '비둘기',
  '홍학',
  '독수리',
  '매',
  '백로',
  '제비',
  '뻐꾸기',
  '딱따구리',
  '공작',
  '타조',
  '앵무',
  '부엉이',
  '갈매기',
  '학',
  // 해양/수중
  '돌고래',
  '백상어',
  '해마',
  '문어',
  '오징어',
  '조개',
  '불가사리',
  '가재',
  '새우',
  '고래',
  '거북',
  '해파리',
  '복어',
  '참치',
  '연어',
  // 곤충/기타
  '나비',
  '잠자리',
  '꿀벌',
  '반딧불',
  '무당벌레',
  '개구리',
  '두꺼비',
  '도마뱀',
  '카멜레온',
  '달팽이',
  // 귀여운/캐릭터성
  '병아리',
  '오리',
  '양',
  '돼지',
  '소',
  '말',
  '당나귀',
  '염소',
  '고등어',
  '꽃게',
  '랍스터',
  '수리',
  '참돔',
  '방울새',
  '직박구리',
]; // 107개

export function generateRandomNickname(): string {
  const adj = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
  const combined = `${adj}${noun}`;

  if (combined.length <= NICKNAME_MAX_LENGTH) {
    return combined;
  }
  return combined.slice(0, NICKNAME_MAX_LENGTH);
}

/**
 * 회원가입용 고유 닉네임 생성 (형용사 + 동물 + 숫자 4자리)
 * 타임스탬프 기반으로 형용사·동물·접미 숫자를 결정한다.
 * 113 형용사 × 107 동물 × 10000 숫자 ≈ 1.2억 조합.
 * 최대 20자 (회원가입 닉네임 제한)
 */
const SIGNUP_NICKNAME_MAX_LENGTH = 20;

export function generateUniqueNickname(): string {
  const ts = Date.now();
  const adjIdx = ts % NICKNAME_ADJECTIVES.length;
  const nounIdx = Math.floor(ts / NICKNAME_ADJECTIVES.length) % NICKNAME_NOUNS.length;
  const suffix = String(ts).slice(-4);

  const adj = NICKNAME_ADJECTIVES[adjIdx];
  const noun = NICKNAME_NOUNS[nounIdx];
  const name = `${adj}${noun}`;

  if (name.length + suffix.length <= SIGNUP_NICKNAME_MAX_LENGTH) {
    return `${name}${suffix}`;
  }
  return name.slice(0, SIGNUP_NICKNAME_MAX_LENGTH - suffix.length) + suffix;
}

/**
 * 친구 이름 resolver
 */

/**
 * 이름 뒤 조사 처리 — 받침 있으면 "과", 없으면 "와"
 * 한글 이외 문자는 받침 없음으로 처리
 */
export function withParticle(name: string): string {
  if (!name) {
    return name;
  }
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    return `${name}와`;
  }
  const hasJongseong = (lastChar - 0xac00) % 28 !== 0;
  return `${name}${hasJongseong ? '과' : '와'}`;
}

export function fNameRes(name: string | undefined, resultId: string): string {
  if (!!name) {
    return name;
  }
  return `친구${resultId.slice(-4)}`;
}

export interface UploadImageOptions {
  prefix?: string; // 파일명 prefix (예: 'trend', 'election')
}

/**
 * Build filename for image upload
 * Format: {prefix}_{timestamp}_{random}.{extension}
 */
export function buildFileName(file: File, options?: UploadImageOptions): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const prefix = options?.prefix || 'image';

  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Get relative time string (YouTube style)
 * Examples: "방금 전", "5분전", "3시간전", "2일전", "1주전", "3개월전", "1년전"
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // 음수인 경우 (미래 시간) 방금 전으로 표시
  if (diffInSeconds < 0) {
    return '방금 전';
  }

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diffInSeconds < minute) {
    return '방금 전';
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute);
    return `${minutes}분전`;
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour);
    return `${hours}시간전`;
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day);
    return `${days}일전`;
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week);
    return `${weeks}주전`;
  } else if (diffInSeconds < year) {
    const months = Math.floor(diffInSeconds / month);
    return `${months}개월전`;
  } else {
    const years = Math.floor(diffInSeconds / year);
    return `${years}년전`;
  }
}

/**
 * Check if a date is within the last 48 hours
 * Used for displaying NEW badge on recent trends
 */
/**
 * Format count with K/M suffix
 * 1500 → 1.5K, 10000 → 10K, 1000000 → 1M, 1500000 → 1.5M
 */
export function formatCount(count: number | undefined): string {
  if (!count) {
    return '0';
  }
  if (count >= 1_000_000) {
    const val = count / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const val = count / 1_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Sanitize comment content
 * - Collapse 3+ consecutive newlines into 2
 * - Trim leading/trailing whitespace
 */
export function sanitizeComment(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

export function isWithin24Hours(dateString: string): boolean {
  const now = new Date();
  const past = new Date(dateString);
  const diffInHours = (now.getTime() - past.getTime()) / (1000 * 60 * 60);

  return diffInHours >= 0 && diffInHours <= 24;
}
