'use client';

import { useState, useCallback, type FC } from 'react';

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
  isOpen: boolean;
  onToggle: () => void;
  onNewOneToOne: () => void;
  onNewGroup: () => void;
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
  isOpen,
  onToggle,
  onNewOneToOne,
  onNewGroup,
}) => {
  const { data: links } = useMyCompareLinks(slug);
  const router = useRouter();
  const { toast, showToast } = useToast();
  const sorted = links ? sortLinks(links) : [];

  const oneToOneLinks = sorted.filter((l) => l.type === 'ONE_TO_ONE');
  const groupLinks = sorted
    .filter((l) => l.type === 'GROUP')
    .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));

  // 스크롤 위치별 블러 제어: 상단/하단 도달 감지
  const [oneToOneScroll, setOneToOneScroll] = useState({ atTop: true, atBottom: false });
  const [groupScroll, setGroupScroll] = useState({ atTop: true, atBottom: false });

  const handleSectionScroll = useCallback(
    (
      e: React.UIEvent<HTMLDivElement>,
      setter: (v: { atTop: boolean; atBottom: boolean }) => void
    ) => {
      const el = e.currentTarget;
      setter({
        atTop: el.scrollTop < 4,
        atBottom: el.scrollHeight - el.scrollTop - el.clientHeight < 4,
      });
    },
    []
  );

  const handleAction = async (link: MyCompareLink) => {
    if (link.status === 'WAITING') {
      const url =
        link.type === 'GROUP'
          ? `${window.location.origin}/compare/group/${link.token}`
          : `${window.location.origin}/compare/${link.token}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사되었어요');
      } catch {
        showToast('복사에 실패했습니다');
      }
      return;
    }
    if (link.type === 'GROUP') {
      router.push(`/compare/group/${link.token}?from=my`);
    } else {
      router.push(`/compare/match/${link.token}?from=my`);
    }
  };

  const getOneToOneName = (link: MyCompareLink) => link.participantNickname ?? '???';

  const getGroupName = (link: MyCompareLink) => link.groupName ?? '그룹';

  return (
    <div
      className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}
      style={getCategoryThemeVars(categoryCode)}
    >
      <button type="button" className={styles.accordionHeader} onClick={onToggle}>
        <CategoryBadge categoryCode={categoryCode} />
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
          {/* 1:1 비교 섹션 */}
          {oneToOneLinks.length > 0 && (
            <>
              <span className={styles.linkSectionLabel}>1:1 케미</span>
              <div
                className={`${styles.linkSection} ${oneToOneLinks.length > 5 ? `${!oneToOneScroll.atTop ? styles.fadeTop : ''} ${!oneToOneScroll.atBottom ? styles.fadeBottom : ''}` : ''}`}
                onScroll={(e) => handleSectionScroll(e, setOneToOneScroll)}
              >
                {oneToOneLinks.map((link) => (
                  <button
                    key={link.token}
                    type="button"
                    className={styles.linkItem}
                    onClick={() => handleAction(link)}
                  >
                    <span
                      className={`${styles.linkStatusTag} ${link.status === 'WAITING' ? styles.linkStatusWaiting : styles.linkStatusDone}`}
                    >
                      {link.status === 'WAITING' ? '대기' : '완료'}
                    </span>
                    <span className={styles.linkName}>{getOneToOneName(link)}</span>
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

          {/* 그룹 비교 섹션 */}
          {groupLinks.length > 0 && (
            <>
              <span
                className={`${styles.linkSectionLabel} ${oneToOneLinks.length > 0 ? styles.linkSectionLabelDivider : ''}`}
              >
                그룹 케미
              </span>
              <div
                className={`${styles.linkSection} ${groupLinks.length > 5 ? `${!groupScroll.atTop ? styles.fadeTop : ''} ${!groupScroll.atBottom ? styles.fadeBottom : ''}` : ''}`}
                onScroll={(e) => handleSectionScroll(e, setGroupScroll)}
              >
                {groupLinks.map((link) => (
                  <button
                    key={link.token}
                    type="button"
                    className={styles.linkItem}
                    onClick={() => handleAction(link)}
                  >
                    <span className={styles.linkStatusTag}>{link.memberCount}명</span>
                    <span className={styles.linkName}>{getGroupName(link)}</span>
                    <span className={styles.linkActionIcon}>
                      <StartArrowIcon width={16} height={16} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.newCompareRow}>
            <button type="button" className={styles.newOneToOneButton} onClick={onNewOneToOne}>
              + 1:1 케미
            </button>
            <button type="button" className={styles.newGroupButton} onClick={onNewGroup}>
              + 그룹 케미
            </button>
          </div>
        </div>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};
