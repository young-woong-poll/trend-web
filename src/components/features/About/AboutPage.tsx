import Image from 'next/image';
import Link from 'next/link';

import gmailImg from '@/assets/img/gmail.png';
import instagramImg from '@/assets/img/instagram.png';
import kakaotalkImg from '@/assets/img/kakaotalk.png';
import styles from '@/components/features/About/AboutPage.module.scss';
import { FaqAccordion } from '@/components/features/About/FaqAccordion';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

const FEATURES = [
  {
    title: '1초 투표',
    description: '3초 안에 이해하고 결정하는 직관적 UI. 복잡한 가입 없이 바로 투표하세요.',
  },
  {
    title: '대중의 생각',
    description:
      '수천 명의 정량적 의견을 즉시 확인. 나와 같은 생각을 가진 사람이 몇 %인지 알 수 있어요.',
  },
];

const FAQ_ITEMS = [
  {
    question: '핫픽은 무료인가요?',
    answer:
      '네, 핫픽의 모든 기능은 무료로 이용하실 수 있습니다. 별도의 가입이나 결제 없이 바로 투표에 참여할 수 있어요.',
  },
  {
    question: '투표는 어떻게 하나요?',
    answer:
      '핫픽 메인 페이지에서 관심 있는 주제를 선택하고, 원하는 선택지를 탭하면 바로 투표가 완료됩니다. 투표 후에는 다른 사람들의 의견 비율을 즉시 확인할 수 있어요.',
  },
  {
    question: '투표 결과는 수정할 수 있나요?',
    answer:
      '한번 투표한 결과는 수정할 수 없습니다. 신중하게 선택해주세요! 이는 투표 결과의 신뢰성을 보장하기 위한 정책입니다.',
  },
  {
    question: '내 투표 기록은 어디서 볼 수 있나요?',
    answer: '투표한 핫픽을 다시 방문하면 내가 선택한 항목과 현재 투표 결과를 확인할 수 있습니다.',
  },
  {
    question: '핫픽 콘텐츠는 어떻게 만들어지나요?',
    answer:
      '핫픽 운영팀이 일상에서 자주 마주치는 애매한 상황, 트렌드 이슈, 재미있는 논쟁거리 등을 엄선하여 제작합니다. 모든 투표는 3초 안에 이해하고 결정할 수 있도록 설계됩니다.',
  },
  {
    question: '제안하고 싶은 투표 주제가 있어요!',
    answer:
      '좋은 아이디어가 있으시다면 아래 문의 채널을 통해 언제든지 제안해주세요. 채택된 주제는 핫픽 콘텐츠로 제작될 수 있습니다.',
  },
];

const CONTACTS = [
  {
    image: gmailImg,
    label: '이메일',
    value: 'voteboxxxxx@gmail.com',
    href: 'mailto:voteboxxxxx@gmail.com',
  },
  {
    image: kakaotalkImg,
    label: '카카오톡 채널',
    value: 'hotpick_kr',
    href: 'http://pf.kakao.com/_TzxiqX',
  },
  {
    image: instagramImg,
    label: '인스타그램',
    value: '@hotpick_kr',
    href: 'https://www.instagram.com/hotpick_kr/',
  },
];

export const AboutPage = () => (
  <div className={styles.page}>
    <MainHeader showSearch={false} />

    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>애매하면 핫픽</h1>
        <p className={styles.heroSub}>투표하고, 대중의 생각을 확인하세요</p>
        <Link href="/" className={styles.ctaLink}>
          <span className={styles.ctaButton}>지금 투표하러 가기 →</span>
        </Link>
      </section>

      {/* 서비스 소개 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>핫픽이란?</h2>
        <p className={styles.sectionDesc}>
          정답이 없는 일상의 고민, 혼자 끙끙대지 마세요.
          <br />
          핫픽은 수천 명의 대중에게 직접 물어보고, 그 답을 숫자로 확인하는 곳입니다.
          <br />
          &ldquo;나만 이렇게 생각하나?&rdquo;에 대한 가장 솔직한 답을 찾아보세요.
        </p>
        <div className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* 문의 채널 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>문의 채널</h2>
        <p className={styles.sectionDesc}>
          의견, 제안, 문의사항이 있으시면 아래 채널로 연락해주세요.
        </p>
        <div className={styles.contactList}>
          {CONTACTS.map((contact) => (
            <a
              key={contact.label}
              href={contact.href}
              className={styles.contactCard}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={contact.image}
                alt={contact.label}
                width={28}
                height={28}
                className={styles.contactIcon}
              />
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>{contact.label}</span>
                <span className={styles.contactValue}>{contact.value}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 저작권 */}
      <footer className={styles.footer}>
        <p className={styles.copyright}>&copy; 2025 HotPick. All rights reserved.</p>
        <p className={styles.legal}>
          본 사이트의 콘텐츠(투표 주제, 이미지, 텍스트 등)는 저작권법에 의해 보호됩니다.
          <br />
          무단 복제, 배포, 전송을 금지합니다.
        </p>
      </footer>
    </main>
  </div>
);
