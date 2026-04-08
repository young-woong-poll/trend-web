'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from '@/components/features/Admin/AdminNav/AdminNav.module.scss';

const NAV_ITEMS = [
  { href: '/admin/bundle', label: '번들' },
  { href: '/admin/hotpick', label: '핫픽' },
  { href: '/admin/category', label: '카테고리' },
  { href: '/admin/server-meta', label: '서버 메타' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/admin/bundle" className={styles.logo}>
        HotPick Admin
      </Link>
      <div className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${pathname.startsWith(item.href) ? styles.linkActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
