'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!isAuthorized) {
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

  // 그룹 핫픽에서 유입된 경우 판별
  const isFromGroup = returnUrl.includes('/compare/group/');

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const nicknameValue = watch('nickname');

  // 닉네임 값이 변경되면 중복확인 상태 초기화
  useEffect(() => {
    setNicknameChecked('idle');
  }, [nicknameValue]);

  const handleCheckNickname = async () => {
    if (!nicknameValue?.trim()) {
      setError('nickname', { message: '닉네임을 입력해주세요' });
      return;
    }
    const result = validateNickname(nicknameValue);
    if (!result.isValid) {
      setError('nickname', { message: result.error });
      return;
    }

    setIsCheckingNickname(true);
    try {
      const available = await checkNicknameAvailability(result.trimmedValue);
      if (!available) {
        setError('nickname', { message: '이미 사용 중인 닉네임이에요' });
        setNicknameChecked('unavailable');
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

      // 가입 완료 → signupToken 정리 (연결 동의 시에만 TKUID 제거)
      clearSignupToken();
      if (withMigration) {
        clearTKUID();
      }
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
    // 중복확인 안 된 상태면 에러 메시지로 안내
    if (nicknameChecked !== 'available') {
      setError('nickname', { message: '닉네임 중복확인을 해주세요' });
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

  return (
    <div className={styles.container}>
      <form className={styles.content} onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.title}>프로필 설정 🙂</h1>
        <p className={styles.subtitle}>프로필만 설정하면 핫픽 회원이에요!</p>

        {/* 닉네임 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            닉네임
            {isFromGroup && (
              <span className={styles.labelHint}>
                · 그룹 비교에서는 별도 표시 이름을 설정할 수 있어요
              </span>
            )}
          </label>
          <div className={styles.nicknameRow}>
            <input
              {...register('nickname', { required: '닉네임을 입력해주세요' })}
              className={`${styles.input} ${errors.nickname ? styles.error : ''} ${nicknameChecked === 'available' ? styles.checked : ''}`}
              placeholder="닉네임을 입력해주세요"
              maxLength={10}
            />
            <button
              type="button"
              className={`${styles.checkButton} ${nicknameChecked === 'available' ? styles.checkDone : ''}`}
              onClick={handleCheckNickname}
              disabled={isCheckingNickname || !nicknameValue?.trim()}
            >
              {isCheckingNickname
                ? '확인 중'
                : nicknameChecked === 'available'
                  ? '사용 가능'
                  : '중복확인'}
            </button>
          </div>
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
            type="submit"
            className={styles.submitButton}
            disabled={
              isSubmitting ||
              isCheckingNickname ||
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
