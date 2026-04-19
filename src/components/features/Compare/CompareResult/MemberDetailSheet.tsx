'use client';

import { useEffect, useState, type FC } from 'react';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { AnswerComparison } from '@/components/features/Compare/CompareResult/AnswerComparison';
import { ChemistryCard } from '@/components/features/Compare/CompareResult/ChemistryCard';
import styles from '@/components/features/Compare/CompareResult/MemberDetailSheet.module.scss';
import { PopularityCompare } from '@/components/features/Compare/CompareResult/PopularityCompare';
import { ShockPoint } from '@/components/features/Compare/CompareResult/ShockPoint';
import { classifyAnswers, findShockPoint } from '@/constants/compare';
import { WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useCompareResult, useCreatePairCompare } from '@/hooks/api/useCompare';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useToast } from '@/hooks/useToast';

interface MemberDetailSheetProps {
  /** 그룹 token (pair compare 생성용) */
  token: string;
  /** 비교 대상 멤버 userId */
  targetUserId: string;
  onClose: () => void;
}

/**
 * 그룹 결과 안에서 멤버 1명과의 1:1 비교 상세 (스펙 §MemberDetailSheet).
 * URL 변경 없이 바텀시트로 노출 — 기존 CompareResult 페이지 자산을 컴포지션.
 *
 * 흐름: 그룹 token + targetUserId → POST createPair → 1:1 token 발급 →
 * useCompareResult로 결과 fetch → ChemistryCard + AnswerComparison + ShockPoint + PopularityCompare 렌더
 */
export const MemberDetailSheet: FC<MemberDetailSheetProps> = ({ token, targetUserId, onClose }) => {
  const pairMutation = useCreatePairCompare(token);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const { data: result, isLoading } = useCompareResult(pairToken ?? '');
  const { toast, showToast } = useToast();

  useEscapeKey(true, onClose);

  // 시트 열릴 때 즉시 pair compare 링크 생성
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await pairMutation.mutateAsync(targetUserId);
        if (!cancelled && res.token) {
          setPairToken(res.token);
        }
      } catch {
        if (!cancelled) {
          showToast('케미 상세보기 생성에 실패했어요');
          onClose();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  // 배경 스크롤 잠금 (iOS position: fixed 패턴)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const me = result?.me ?? {};
  const target = result?.target ?? {};
  const isTargetWithdrawn = target.isWithdrawn === true;
  const myNickname = me.displayName ?? me.nickname ?? '';
  const targetNickname = isTargetWithdrawn
    ? WITHDRAWN_NICKNAME
    : (target.displayName ?? target.nickname ?? '');

  const shockPoint = result ? findShockPoint(result) : null;
  const storyData = result ? classifyAnswers(result) : null;

  const handleShareThis = async () => {
    if (!pairToken) {
      return;
    }
    const url = `${window.location.origin}/compare/group/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('초대 링크가 복사되었어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sheet} role="dialog" aria-label="멤버별 케미 상세">
        <div className={styles.sheetHeader}>
          <span className={styles.sheetLabel}>케미 상세보기</span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className={styles.sheetBody}>
          {(isLoading || !result) && (
            <div className={styles.loading}>
              <p className={styles.loadingTitle}>케미를 분석하고 있어요</p>
            </div>
          )}

          {result && (
            <>
              <ChemistryCard
                matchRate={result.matchRate ?? 0}
                myNickname={myNickname}
                targetNickname={targetNickname}
                isTargetWithdrawn={isTargetWithdrawn}
              />

              {storyData && (
                <AnswerComparison
                  data={storyData}
                  myNickname={myNickname}
                  targetNickname={targetNickname}
                />
              )}

              {shockPoint && (
                <ShockPoint
                  data={shockPoint}
                  myNickname={myNickname}
                  targetNickname={targetNickname}
                />
              )}

              <PopularityCompare result={result} />

              <p className={styles.notice}>이 케미 결과는 이력에 저장되지 않아요</p>
            </>
          )}
        </div>

        {result && (
          <div className={styles.sheetFooter}>
            <button type="button" className={styles.shareButton} onClick={handleShareThis}>
              이 케미 결과 공유하기
            </button>
          </div>
        )}
      </div>
      {/* Toast (시트 안 동작 알림) */}
      {toast.isVisible && (
        <div className={styles.toastWrap}>
          <div className={styles.toast}>{toast.message}</div>
        </div>
      )}
    </>,
    document.body
  );
};
