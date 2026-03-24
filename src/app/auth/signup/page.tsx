'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/app/auth/signup/SignupPage.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { postSignupProfile } from '@/hooks/api/useAuthApi';
import { checkNicknameAvailability, getSuggestedNickname } from '@/hooks/api/useNickname';

type Gender = 'MALE' | 'FEMALE';

const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대+'] as const;

interface ConsentInfo {
  genderConsent: boolean;
  ageConsent: boolean;
}

const SignupPage = () => {
  const router = useRouter();
  const { user, setUser, isLoggedIn, setIsNewUserFlag } = useAuth();

  // consent 정보
  const [consent, setConsent] = useState<ConsentInfo>({
    genderConsent: true,
    ageConsent: true,
  });

  // 닉네임
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // 선택 입력
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // sessionStorage에서 consent 정보 읽기
  useEffect(() => {
    const stored = sessionStorage.getItem('signup_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConsentInfo;
        setConsent(parsed);
      } catch {
        // 파싱 실패 시 기본값 유지
      }
    }
  }, []);

  // 비로그인 유저가 직접 접근 시 홈으로
  useEffect(() => {
    if (!isLoggedIn && !user) {
      // 로딩 중일 수 있으므로 약간의 여유
      const timeout = setTimeout(() => {
        if (!user) {
          router.replace('/');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoggedIn, user, router]);

  // 추천 닉네임 로드
  const loadSuggestion = useCallback(async () => {
    try {
      const suggested = await getSuggestedNickname();
      setNickname(suggested);
      setNicknameError('');
    } catch {
      // 실패 시 유저가 직접 입력
    }
  }, []);

  useEffect(() => {
    void loadSuggestion();
  }, [loadSuggestion]);

  const handleNicknameBlur = async () => {
    if (!nickname.trim()) {
      return;
    }
    setIsCheckingNickname(true);
    try {
      const available = await checkNicknameAvailability(nickname.trim());
      if (!available) {
        setNicknameError('중복된 닉네임입니다');
      } else {
        setNicknameError('');
      }
    } catch {
      // submit에서 재확인
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      // 닉네임 중복 확인
      const available = await checkNicknameAvailability(trimmed);
      if (!available) {
        setNicknameError('중복된 닉네임입니다');
        return;
      }

      const result = await postSignupProfile({
        nickname: trimmed,
        gender: gender ?? undefined,
        ageGroup: ageGroup ?? undefined,
      });

      setUser(result.user);
      sessionStorage.removeItem('signup_consent');

      // auth_intent에 저장된 원래 URL로 복귀
      const intentStr = sessionStorage.getItem('auth_intent');
      sessionStorage.removeItem('auth_intent');

      if (intentStr) {
        try {
          const intent = JSON.parse(intentStr) as { returnUrl?: string };
          if (intent.returnUrl) {
            router.replace(intent.returnUrl);
            return;
          }
        } catch {
          // 파싱 실패
        }
      }
      router.replace('/');
    } catch {
      setNicknameError('프로필 설정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택 입력 없이 닉네임만 제출
  const handleSkip = async () => {
    setGender(null);
    setAgeGroup(null);
    await handleSubmit();
  };

  const needsGender = !consent.genderConsent;
  const needsAge = !consent.ageConsent;
  const hasOptionalFields = needsGender || needsAge;

  // 보상 코인 계산
  const rewardCoins = (gender ? 5 : 0) + (ageGroup ? 5 : 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>프로필 설정</h1>
        <p className={styles.subtitle}>핫픽을 시작하기 위한 기본 정보를 입력해주세요</p>

        {/* 닉네임 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>닉네임</span>
            <span className={styles.required}>필수</span>
          </div>
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${nicknameError ? styles.inputError : ''}`}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameError('');
              }}
              onBlur={handleNicknameBlur}
              placeholder="닉네임 입력"
              maxLength={20}
            />
            <button
              type="button"
              className={styles.refreshButton}
              onClick={loadSuggestion}
              aria-label="닉네임 재생성"
            >
              ↻
            </button>
          </div>
          <p className={styles.errorText}>{nicknameError}</p>
        </div>

        {/* 성별 (카카오 미동의 시) */}
        {needsGender && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>성별</span>
              <span className={styles.coinBadge}>+5 코인</span>
            </div>
            <div className={styles.genderGroup}>
              <button
                type="button"
                className={`${styles.genderButton} ${gender === 'MALE' ? styles.selected : ''}`}
                onClick={() => setGender(gender === 'MALE' ? null : 'MALE')}
              >
                남성
              </button>
              <button
                type="button"
                className={`${styles.genderButton} ${gender === 'FEMALE' ? styles.selected : ''}`}
                onClick={() => setGender(gender === 'FEMALE' ? null : 'FEMALE')}
              >
                여성
              </button>
            </div>
          </div>
        )}

        {/* 나이대 (카카오 미동의 시) */}
        {needsAge && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>나이대</span>
              <span className={styles.coinBadge}>+5 코인</span>
            </div>
            <div className={styles.ageGrid}>
              {AGE_GROUPS.map((age) => (
                <button
                  key={age}
                  type="button"
                  className={`${styles.ageButton} ${ageGroup === age ? styles.selected : ''}`}
                  onClick={() => setAgeGroup(ageGroup === age ? null : age)}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 보상 안내 */}
        {hasOptionalFields && rewardCoins > 0 && (
          <p className={styles.rewardInfo}>
            입력 완료 시 <strong>{rewardCoins}코인</strong> 지급
          </p>
        )}

        <button
          type="button"
          className={styles.submitButton}
          disabled={isSubmitting || isCheckingNickname || !nickname.trim()}
          onClick={handleSubmit}
        >
          {isSubmitting ? '설정 중...' : hasOptionalFields ? '프로필 설정 완료' : '시작하기'}
        </button>

        {hasOptionalFields && (
          <button
            type="button"
            className={styles.skipButton}
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
