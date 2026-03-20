'use client';

/**
 * Mock Main Page — 검색 아이콘 진입점이 추가된 메인 헤더 디자인 확인용
 * 실제 메인 페이지(MainHeader)에 검색 아이콘을 추가했을 때의 모습을 확인합니다.
 */

import Image from 'next/image';
import Link from 'next/link';

import styles from '@/app/mock/main/page.module.scss';
import SearchIcon from '@/assets/icon/SearchIcon';
import mainLogo1x from '@/assets/img/main-logo@1x.png';
import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';

export default function MockMainPage() {
  return (
    <>
      {/* 검색 아이콘이 추가된 MainHeader mock */}
      <header className={styles.header}>
        <Link href="/" className={styles.logoContainer} aria-label="메인으로 이동">
          <Image src={mainLogo1x} alt="HotPick" className={styles.logo} priority height={24} />
        </Link>
        <div className={styles.rightSection}>
          <p className={styles.text}>
            <i>투표하고 사람들의 생각을 확인하세요</i>
          </p>
          <Link href="/mock/search" className={styles.searchButton} aria-label="검색">
            <SearchIcon width={20} height={20} />
          </Link>
        </div>
      </header>

      <FlexibleLayout>
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>메인 피드 영역</p>
          <p className={styles.placeholderHint}>
            위 헤더의 검색 아이콘(돋보기)을 눌러 검색 화면으로 이동합니다
          </p>

          {/* Mock 카드 샘플 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.mockCard}>
              <div className={styles.mockCategory}>카테고리</div>
              <div className={styles.mockTitle}>여기에 핫픽 제목이 들어갑니다 #{i}</div>
              <div className={styles.mockVoteBar}>
                <div className={styles.mockBarFill} style={{ width: `${40 + i * 10}%` }} />
                <span>A 옵션 {40 + i * 10}%</span>
              </div>
              <div className={styles.mockVoteBar}>
                <div className={styles.mockBarFill} style={{ width: `${60 - i * 10}%` }} />
                <span>B 옵션 {60 - i * 10}%</span>
              </div>
              <div className={styles.mockMeta}>{(1234 * i).toLocaleString()}명 참여</div>
            </div>
          ))}
        </div>
      </FlexibleLayout>
    </>
  );
}
