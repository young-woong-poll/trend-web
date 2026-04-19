'use client';

import { useCallback, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import CopyDoubleIcon from '@/assets/icon/CopyDoubleIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Main/MyBundleList/MyBundleList.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import type { CategoryCode } from '@/types/hotpick';
import type { MyCompareLink } from '@/types/my-compare';

interface BundleAccordionProps {
  slug: string;
  title: string;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  category?: string;
  isOpen: boolean;
  onToggle: () => void;
  /** 케미 테스트 만들기 모달 트리거 (그룹/1:1 단일화) */
  onNewCompare: () => void;
}

function sortLinks(links: MyCompareLink[]): MyCompareLink[] {
  return [...links].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'WAITING' ? -1 : 1;
    }
    return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
  });
}

export const BundleAccordion: FC<BundleAccordionProps> = ({
  slug,
  title,
  categoryCode,
  categoryMeta,
  category,
  isOpen,
  onToggle,
  onNewCompare,
}) => {
  const { data: links } = useMyCompareLinks(slug);
  const router = useRouter();
  const { toast, showToast } = useToast();

  // 마이그레이션 후 모든 링크가 GROUP으로 수렴. ONE_TO_ONE 링크도 /compare/group/{token}으로
  // 라우트가 redirect 되므로 단일 리스트로 통합 노출.
  const sorted = links ? sortLinks(links) : [];

  // 5개 초과 시 페이드 마스크 — 스크롤 위치별 제어
  const [scrollState, setScrollState] = useState({ atTop: true, atBottom: false });

  const handleSectionScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollState({
      atTop: el.scrollTop < 4,
      atBottom: el.scrollHeight - el.scrollTop - el.clientHeight < 4,
    });
  }, []);

  const handleAction = async (link: MyCompareLink) => {
    if (link.status === 'WAITING') {
      // 대기 상태 — 초대 링크 복사
      const url = `${window.location.origin}/compare/group/${link.token}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사되었어요');
      } catch {
        showToast('복사에 실패했어요');
      }
      return;
    }
    // 완료 — 그룹 결과 페이지 (1:1 라우트는 자동 redirect)
    router.push(`/compare/group/${link.token}?from=my`);
  };

  const getLinkName = (link: MyCompareLink) => {
    if (link.groupName) {
      return link.groupName;
    }
    if (link.participantNickname) {
      return link.participantNickname;
    }
    return '내 케미 테스트';
  };

  return (
    <div
      className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}
      style={getCategoryThemeVars(categoryCode, categoryMeta)}
    >
      <button type="button" className={styles.accordionHeader} onClick={onToggle}>
        <CategoryBadge categoryCode={categoryCode} categoryMeta={categoryMeta} label={category} />
        <span className={styles.accordionTitle}>{title}</span>
        <span className={styles.accordionMeta}>
          <span className={styles.accordionCount}>{sorted.length}건</span>
          <span className={`${styles.accordionArrow} ${isOpen ? styles.accordionArrowOpen : ''}`}>
            ▾
          </span>
        </span>
      </button>

      <div className={`${styles.accordionContent} ${isOpen ? styles.accordionContentOpen : ''}`}>
        <div className={styles.linkList}>
          {sorted.length > 0 && (
            <>
              <span className={styles.linkSectionLabel}>내 케미</span>
              <div
                className={`${styles.linkSection} ${
                  sorted.length > 5
                    ? `${!scrollState.atTop ? styles.fadeTop : ''} ${
                        !scrollState.atBottom ? styles.fadeBottom : ''
                      }`
                    : ''
                }`}
                onScroll={handleSectionScroll}
              >
                {sorted.map((link) => (
                  <button
                    key={link.token}
                    type="button"
                    className={styles.linkItem}
                    onClick={() => handleAction(link)}
                  >
                    <span
                      className={`${styles.linkStatusTag} ${
                        link.status === 'WAITING' ? styles.linkStatusWaiting : styles.linkStatusDone
                      }`}
                    >
                      {link.status === 'WAITING'
                        ? '대기'
                        : link.memberCount
                          ? `${link.memberCount}명`
                          : '완료'}
                    </span>
                    <span className={styles.linkName}>{getLinkName(link)}</span>
                    <span className={styles.linkActionIcon}>
                      {link.status === 'WAITING' ? (
                        <CopyDoubleIcon width={16} height={16} stroke="currentColor" />
                      ) : (
                        <StartArrowIcon width={16} height={16} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.newCompareRow}>
            <button type="button" className={styles.newGroupButton} onClick={onNewCompare}>
              + 새 케미 테스트
            </button>
          </div>
        </div>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};
