'use client';

import styles from '@/app/dev/cta-preview/page.module.scss';
import Variant2Transition from '@/app/dev/cta-preview/Variant2Transition';

const CtaPreviewPage = () => (
  <div className={styles.root}>
    <div className={styles.controls}>
      <p className={styles.label}>방법 2 · Sticky → Static</p>
      <p className={styles.desc}>
        Hero에선 sticky 통통 / Detail 진입 시 sticky fade-out + inline CTA fade-in
      </p>
    </div>

    <div className={styles.stage}>
      <Variant2Transition />
    </div>
  </div>
);

export default CtaPreviewPage;
