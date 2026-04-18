'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';

import styles from '@/components/features/Auth/SignupForm.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { submitSignup } from '@/hooks/api/useAuthApi';
import { checkNicknameAvailability } from '@/hooks/api/useNickname';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { clearSignupToken, hasSignupToken } from '@/lib/signupToken';
import { clearTKUID, getTKUID, hasTKUID } from '@/lib/tkuid';
import { validateNickname } from '@/lib/utils';

type Gender = 'male' | 'female' | null;

interface SignupFormValues {
  nickname: string;
  birthYear: string;
  agreeTerms: boolean;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

interface MigrationPromptProps {
  isOpen: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

const MigrationPrompt = ({ isOpen, onConfirm, onSkip, isLoading }: MigrationPromptProps) => {
  const isMobile = useIsMobile();
  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  const portal = document.getElementById('portal-root');
  if (!portal) {
    return null;
  }

  return createPortal(
    <div className={styles.promptDimmed} role="presentation">
      <div
        className={isMobile ? styles.promptBottomSheet : styles.promptCenterModal}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className={styles.promptContent}>
          <p className={styles.promptTitle}>이전 활동을 연결할까요?</p>
          <p className={styles.promptDescription}>이 브라우저의 데이터를 계정에 연동해요.</p>
          <ul className={styles.promptList}>
            <li>투표 데이터 연결</li>
            <li>좋아요 데이터 연결</li>
            <li>댓글 연결, 닉네임은 계정 닉네임으로 변경</li>
          </ul>
          <p className={styles.promptWarning}>
            이 기회는 <strong>한 번만</strong> 제공돼요.
          </p>
          <div className={styles.promptButtons}>
            <button
              type="button"
              className={styles.promptFillButton}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? '연결 중...' : '연결하기'}
            </button>
            <button
              type="button"
              className={styles.promptSkipButton}
              onClick={onSkip}
              disabled={isLoading}
            >
              건너뛰기
            </button>
          </div>
        </div>
      </div>
    </div>,
    portal
  );
};

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { showToast } = useModal();

  const returnUrl = searchParams.get('returnUrl') || '/';

  // signupToken 없으면 접근 불가 → 메인으로 리다이렉트
  const isAuthorized = hasSignupToken();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!isAuthorized && !isNavigatingRef.current) {
      router.replace('/');
    }
  }, [isAuthorized, router]);

  const [gender, setGender] = useState<Gender>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState<'idle' | 'available' | 'unavailable'>(
    'idle'
  );
  const [showMigration, setShowMigration] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<SignupFormValues | null>(null);

  // 비교 페이지에서 유입된 경우 판별
  const isFromGroup = returnUrl.includes('/compare/group/');
  const isFromCompare = returnUrl.includes('/compare/') && !isFromGroup;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    setFocus,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const nicknameValue = watch('nickname');
  const birthYearValue = watch('birthYear');
  const agreeTermsValue = watch('agreeTerms');

  // 닉네임 값이 변경되면 중복확인 상태 초기화
  useEffect(() => {
    setNicknameChecked('idle');
  }, [nicknameValue]);

  const handleCheckNickname = async () => {
    if (!nicknameValue?.trim()) {
      setError('nickname', { message: '닉네임을 입력해주세요' });
      setFocus('nickname');
      return;
    }
    const result = validateNickname(nicknameValue);
    if (!result.isValid) {
      setError('nickname', { message: result.error });
      setFocus('nickname');
      return;
    }

    setIsCheckingNickname(true);
    try {
      const available = await checkNicknameAvailability(result.trimmedValue);
      if (!available) {
        setError('nickname', { message: '이미 사용 중인 닉네임이에요' });
        setNicknameChecked('unavailable');
        setFocus('nickname');
      } else {
        clearErrors('nickname');
        setNicknameChecked('available');
      }
    } catch {
      // 중복체크 API 실패 시 일단 통과 (가입 시 서버에서 재검증)
      clearErrors('nickname');
      setNicknameChecked('available');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const doSignup = async (data: SignupFormValues, withMigration?: boolean) => {
    const trimmed = data.nickname.trim();
    const validation = validateNickname(trimmed);
    if (!validation.isValid) {
      setError('nickname', { message: validation.error });
      return;
    }

    setIsSubmitting(true);

    // 제출 전 닉네임 중복 재확인
    try {
      const available = await checkNicknameAvailability(trimmed);
      if (!available) {
        setError('nickname', { message: '이미 사용 중인 닉네임이에요' });
        setFocus('nickname');
        setIsSubmitting(false);
        return;
      }
    } catch {
      // 중복체크 실패 시 가입 시도 (서버에서 최종 검증)
    }
    try {
      const tkuId = withMigration ? getTKUID() : undefined;
      const result = await submitSignup({
        nickname: trimmed,
        gender: gender === 'male' ? 'MALE' : 'FEMALE',
        birthYear: Number(data.birthYear),
        ...(tkuId ? { tkuId } : {}),
      });

      setUser(result.user);
      showToast('핫픽 회원이 되신걸 환영합니다 🎉🎉');

      // 가드 비활성화 후 이동 → 토큰 정리 순서로 처리
      // clearSignupToken()이 먼저 실행되면 setUser 리렌더 시 가드가 홈으로 튕김
      isNavigatingRef.current = true;

      if (isFromGroup) {
        const returnUrlObj = new URL(returnUrl, window.location.origin);
        const bundleSlug = returnUrlObj.searchParams.get('bundleSlug');
        const groupPath = returnUrlObj.pathname; // /compare/group/{token}
        const groupReturnUrl = `${groupPath}?joinAfter=true`;
        router.replace(
          `/bundle/${bundleSlug}/play?returnUrl=${encodeURIComponent(groupReturnUrl)}`
        );
      } else if (isFromCompare) {
        const returnUrlObj = new URL(returnUrl, window.location.origin);
        const bundleSlug = returnUrlObj.searchParams.get('bundleSlug');
        const compareToken = returnUrlObj.searchParams.get('compareToken');
        router.replace(`/bundle/${bundleSlug}/play?compareToken=${compareToken}`);
      } else {
        router.replace(returnUrl);
      }

      // 이동 후 토큰 정리 (연결 동의 시에만 TKUID 제거)
      clearSignupToken();
      if (withMigration) {
        clearTKUID();
      }
    } catch {
      showToast('회원가입에 실패했습니다. 잠시후 다시 시도해주세요');
    } finally {
      setIsSubmitting(false);
      setPendingFormData(null);
    }
  };

  const handleMigrationConfirm = () => {
    if (!pendingFormData) {
      return;
    }
    setShowMigration(false);
    void doSignup(pendingFormData, true);
  };

  const handleMigrationSkip = () => {
    if (!pendingFormData) {
      return;
    }
    setShowMigration(false);
    void doSignup(pendingFormData, false);
  };

  const onSubmit = (data: SignupFormValues) => {
    // 중복확인 안 된 상태면 에러 메시지로 안내
    if (nicknameChecked !== 'available') {
      setError('nickname', { message: '닉네임 중복확인을 해주세요' });
      setFocus('nickname');
      return;
    }

    if (hasTKUID()) {
      setPendingFormData(data);
      setShowMigration(true);
      return;
    }
    void doSignup(data);
  };

  if (!isAuthorized) {
    return null;
  }

  type CtaAction = 'none' | 'check' | 'submit';
  const ctaState: { label: string; action: CtaAction; disabled: boolean } = (() => {
    if (isSubmitting) {
      return { label: '가입 중...', action: 'none', disabled: true };
    }
    if (isCheckingNickname) {
      return { label: '닉네임 확인 중...', action: 'none', disabled: true };
    }
    if (!nicknameValue?.trim()) {
      return { label: '닉네임을 입력해주세요', action: 'none', disabled: true };
    }
    if (nicknameChecked === 'unavailable') {
      return { label: '다른 닉네임을 입력해주세요', action: 'none', disabled: true };
    }
    if (nicknameChecked !== 'available') {
      return { label: '닉네임 중복확인', action: 'check', disabled: false };
    }
    if (!gender) {
      return { label: '성별을 선택해주세요', action: 'none', disabled: true };
    }
    if (!birthYearValue) {
      return { label: '태어난 해를 선택해주세요', action: 'none', disabled: true };
    }
    if (!agreeTermsValue) {
      return { label: '약관 동의하고 시작하기', action: 'submit', disabled: false };
    }
    return { label: '핫픽 시작하기', action: 'submit', disabled: false };
  })();

  const handleCtaClick = () => {
    if (ctaState.action === 'check') {
      void handleCheckNickname();
    } else if (ctaState.action === 'submit') {
      if (!agreeTermsValue) {
        setValue('agreeTerms', true, { shouldValidate: true });
      }
      void handleSubmit(onSubmit)();
    }
  };

  return (
    <div className={styles.container}>
      <form
        className={styles.content}
        onSubmit={(e) => {
          e.preventDefault();
          handleCtaClick();
        }}
      >
        <h1 className={styles.title}>프로필 설정 🙂</h1>
        <p className={styles.subtitle}>프로필만 설정하면 핫픽 회원이에요!</p>

        {/* 닉네임 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            닉네임
            {isFromGroup && (
              <span className={styles.labelHint}>
                · 그룹 내에서 별도 표시 이름을 설정할 수 있어요
              </span>
            )}
          </label>
          <input
            {...register('nickname', { required: '닉네임을 입력해주세요' })}
            className={`${styles.input} ${errors.nickname ? styles.error : ''} ${nicknameChecked === 'available' ? styles.checked : ''}`}
            placeholder="닉네임을 입력해주세요"
            maxLength={10}
          />
          {nicknameChecked === 'available' && !errors.nickname && (
            <p className={styles.successText}>사용 가능한 닉네임이에요</p>
          )}
          {errors.nickname?.message && (
            <p className={styles.errorText}>{errors.nickname.message}</p>
          )}
        </div>

        {/* 성별 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>성별</label>
          <div className={styles.genderGroup}>
            <button
              type="button"
              className={`${styles.genderButton} ${gender === 'male' ? styles.selected : ''}`}
              onClick={() => setGender('male')}
            >
              남성
            </button>
            <button
              type="button"
              className={`${styles.genderButton} ${gender === 'female' ? styles.selected : ''}`}
              onClick={() => setGender('female')}
            >
              여성
            </button>
          </div>
        </div>

        {/* 태어난 년도 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>태어난 년도</label>
          <select
            {...register('birthYear', { required: true })}
            className={styles.selectInput}
            defaultValue=""
          >
            <option value="" disabled>
              선택하세요
            </option>
            {Array.from({ length: 73 }, (_, i) => new Date().getFullYear() - 14 - i).map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        {/* 약관 동의 */}
        <div className={styles.agreementGroup}>
          <label
            className={`${styles.agreementButton} ${watch('agreeTerms') ? styles.agreementChecked : ''}`}
          >
            <input
              type="checkbox"
              {...register('agreeTerms', { required: true })}
              className={styles.agreementHiddenInput}
            />
            <span className={styles.agreementCheckIcon}>{watch('agreeTerms') ? '✓' : ''}</span>
            <span className={styles.agreementText}>
              {' '}
              핫픽{' '}
              <a
                href="https://kimsuky.notion.site/HotPick-33210e0b649280bf9d4ffb6899538643"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.agreementLink}
                onClick={(e) => e.stopPropagation()}
              >
                이용약관
              </a>
              {' 및 '}
              <a
                href="https://kimsuky.notion.site/HotPick-33210e0b6492806f8992cef7ce933abf"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.agreementLink}
                onClick={(e) => e.stopPropagation()}
              >
                개인정보처리방침
              </a>
              에 동의합니다.
            </span>
          </label>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleCtaClick}
            disabled={ctaState.disabled}
          >
            {ctaState.label}
          </button>
        </div>
      </form>

      <MigrationPrompt
        isOpen={showMigration}
        onConfirm={handleMigrationConfirm}
        onSkip={handleMigrationSkip}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default SignupForm;
