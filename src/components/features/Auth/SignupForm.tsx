'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';

import styles from '@/components/features/Auth/SignupForm.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { submitSignup } from '@/hooks/api/useAuthApi';
import { checkNicknameAvailability, getSuggestedNickname } from '@/hooks/api/useNickname';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { clearSignupToken, hasSignupToken } from '@/lib/signupToken';
import { clearTKUID, getTKUID, hasTKUID } from '@/lib/tkuid';

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
          <p className={styles.promptDescription}>
            이 브라우저에서 남긴 활동을 내 계정으로 연동할 수 있어요.
          </p>
          <p className={styles.promptDescription}>
            <strong>연결하면 이렇게 돼요</strong>
            <br />⋅ 투표, 공감 기록이 내 계정에 연결돼요.
            <br />⋅ 댓글은 내용만 유지되고, 닉네임이 계정 닉네임으로 변경돼요.
            <br />⋅ 기존 비로그인 데이터는 이 브라우저에서 삭제돼요.
          </p>
          <p className={styles.promptDescription}>
            ❗이 기회는 <strong>한 번만</strong> 제공되며, 건너뛰면{' '}
            <strong>다시 연동할 수 없어요.</strong>
          </p>
          <div className={styles.promptButtons}>
            <button
              type="button"
              className={styles.promptFillButton}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? '연결 중...' : '이전 활동 연결하기'}
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

  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/');
    }
  }, [isAuthorized, router]);

  const [gender, setGender] = useState<Gender>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<SignupFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const nicknameValue = watch('nickname');

  const loadSuggestion = useCallback(() => {
    const suggested = getSuggestedNickname();
    setValue('nickname', suggested);
    clearErrors('nickname');
  }, [setValue, clearErrors]);

  useEffect(() => {
    loadSuggestion();
  }, [loadSuggestion]);

  const handleBlur = async () => {
    if (!nicknameValue?.trim()) {
      return;
    }
    setIsChecking(true);
    try {
      const available = await checkNicknameAvailability(nicknameValue.trim());
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
      } else {
        clearErrors('nickname');
      }
    } catch {
      // 검사 실패 시 submit에서 재확인
    } finally {
      setIsChecking(false);
    }
  };

  const doSignup = async (data: SignupFormValues, withMigration?: boolean) => {
    const trimmed = data.nickname.trim();
    setIsSubmitting(true);
    try {
      const available = await checkNicknameAvailability(trimmed);
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
        return;
      }

      const tkuId = withMigration ? getTKUID() : undefined;
      const result = await submitSignup({
        nickname: trimmed,
        gender: gender === 'male' ? 'MALE' : 'FEMALE',
        birthYear: Number(data.birthYear),
        ...(tkuId ? { tkuId } : {}),
      });

      // 가입 완료 → signupToken 정리 + TKUID 제거 (이후 쿠키 기반 인증)
      clearSignupToken();
      clearTKUID();
      setUser(result.user);

      showToast('핫픽 회원이 되신걸 환영합니다 🎉🎉');
      router.replace(returnUrl);
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

  return (
    <div className={styles.container}>
      <form className={styles.content} onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.title}>거의 다 왔어요!</h1>
        <p className={styles.subtitle}>가입 정보만 입력하면 바로 시작할 수 있어요</p>

        {/* 닉네임 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>닉네임</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('nickname', { required: '닉네임을 입력해주세요' })}
              className={`${styles.input} ${errors.nickname ? styles.error : ''}`}
              placeholder="닉네임 입력"
              maxLength={20}
              onBlur={handleBlur}
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

        {/* 태어난 연도 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>태어난 연도</label>
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
            type="submit"
            className={styles.submitButton}
            disabled={
              isSubmitting ||
              isChecking ||
              !nicknameValue?.trim() ||
              !gender ||
              !watch('birthYear') ||
              !watch('agreeTerms')
            }
          >
            {isSubmitting ? '가입 중...' : '핫픽 시작하기'}
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
