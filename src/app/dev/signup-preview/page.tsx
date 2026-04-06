'use client';

import { useState } from 'react';

import styles from '@/components/features/Auth/SignupForm.module.scss';

type Gender = 'male' | 'female' | null;

/**
 * 회원가입 페이지 미리보기 (dev only)
 * returnUrl에 /compare/group/ 포함된 그룹 유입 케이스 시뮬레이션
 */
export default function SignupPreviewPage() {
  const [gender, setGender] = useState<Gender>(null);
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 그룹 유입 시뮬레이션: 항상 true
  const isFromGroup = true;

  const isFormValid = nickname.trim() && gender && birthYear && agreeTerms;

  return (
    <div className={styles.container}>
      <form
        className={styles.content}
        onSubmit={(e) => {
          e.preventDefault();
          alert('(mock) 가입 완료 → /compare/group/group-abc 로 이동');
        }}
      >
        <h1 className={styles.title}>마지막입니다 🙏</h1>

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
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              placeholder="나를 나타내는 이름을 입력해주세요"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
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
            className={styles.selectInput}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
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
            className={`${styles.agreementButton} ${agreeTerms ? styles.agreementChecked : ''}`}
          >
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className={styles.agreementHiddenInput}
            />
            <span className={styles.agreementCheckIcon}>{agreeTerms ? '✓' : ''}</span>
            <span className={styles.agreementText}>
              핫픽 <span className={styles.agreementLink}>이용약관</span>
              {' 및 '}
              <span className={styles.agreementLink}>개인정보처리방침</span>에 동의합니다.
            </span>
          </label>
        </div>

        <div className={styles.footer}>
          <button type="submit" className={styles.submitButton} disabled={!isFormValid}>
            핫픽 시작하기
          </button>
        </div>
      </form>
    </div>
  );
}
