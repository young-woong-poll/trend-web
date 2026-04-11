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
    title: '1초 비교',
    description: '탭 한 번으로 대중과 내 생각을 비교',
  },
  {
    title: '숫자로 확인',
    description: '나와 같은 사람이 몇 % 인지 확인할 수 있어요',
  },
];

const FAQ_ITEMS = [
  {
    question: '핫픽은 무료인가요?',
    answer:
      '네, 핫픽의 모든 기능은 무료로 이용하실 수 있습니다. 별도의 가입이나 결제 없이 바로 투표에 참여할 수 있어요.',
  },
  {
    question: '로그인 없이도 이용할 수 있나요?',
    answer:
      '네, 로그인 없이도 투표 참여와 결과 확인이 가능합니다. 다만 카카오 로그인을 하면 성별·연령대별 투표 통계 확인, 마이페이지에서 내 투표·댓글 기록 관리, 좋아요한 핫픽 모아보기 등 더 많은 기능을 이용할 수 있어요.',
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
    question: '로그인 전 활동을 계정에 연동할 수 있나요?',
    answer:
      '네, 회원가입 시 최초 1회에 한해 현재 브라우저에 저장된 투표·좋아요·댓글 기록을 내 계정에 연동할 수 있습니다. 이 기회는 가입 시점에만 제공되며, 이후에는 연동할 수 없으니 가입 시 꼭 확인해주세요.',
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
  {
    question: '케미 테스트가 뭔가요?',
    answer:
      '하나의 주제로 묶인 5~10개 질문 팩이에요. 결혼 가치관, 직장인 생존 같은 테마별로 구성되어 있고, 모두 답한 뒤 친구·연인과 생각을 비교하고 케미를 확인할 수 있어요.',
  },
  {
    question: '케미 테스트는 로그인 없이도 할 수 있나요?',
    answer:
      '테스트 소개 페이지는 누구나 볼 수 있지만, 참여와 결과 확인은 로그인이 필요해요. 카카오 로그인으로 간편하게 시작할 수 있습니다.',
  },
  {
    question: '1:1 케미와 그룹 케미는 뭐가 다른가요?',
    answer:
      '1:1 케미는 한 사람과 답변을 비교해 둘만의 케미 등급을 확인하는 거예요. 그룹 케미는 최대 50명까지 함께 참여해서 관계도 그래프, 가치관 지도 같은 다양한 분석을 볼 수 있어요.',
  },
  {
    question: '케미 등급은 어떻게 정해지나요?',
    answer:
      '같은 답을 고른 비율로 정해져요. 80% 이상이면 소울메이트(S), 60% 이상이면 찰떡궁합(A), 40% 이상이면 밀당 케미(B), 20% 이상이면 반전 매력(C), 그 아래면 평행우주(D) 등급이에요.',
  },
  {
    question: '대중성 캐릭터는 뭔가요?',
    answer:
      '내 답변이 대중의 선택과 얼마나 비슷한지를 동물 캐릭터로 보여줘요. 여론의 사자왕부터 유니콘까지 5종류가 있고, 같은 사람이라도 그룹마다 다른 캐릭터가 나올 수 있어요.',
  },
  {
    question: '케미 테스트 답변을 수정하거나 다시 할 수 있나요?',
    answer:
      '답변은 수정할 수 없어요. 케미 결과의 신뢰성을 위해 한 번 제출하면 확정됩니다. 신중하게 골라주세요!',
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
        <h1 className={styles.heroTitle}>생각을 비교하다, 핫픽</h1>
        <p className={styles.heroSub}>대중의 생각부터 연인의 가치관까지</p>
      </section>

      {/* 서비스 소개 */}
      <section className={styles.section}>
        <p className={styles.sectionDesc}>
          답이 없는 일상의 고민,
          <br />
          사람들의 생각을 데이터화 하면 좋을텐데...
          <br />
          <br />
          핫픽은 이런 생각에서 시작된 서비스예요
          <br />
          &ldquo;나만 이렇게 생각하나?&rdquo;에 대한 솔직한 답을 찾아보세요!
        </p>
        <div className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
        <Link href="/" className={styles.ctaLink}>
          <span className={styles.ctaButton}>지금 비교하러 가기 →</span>
        </Link>
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

      {/* 약관 · 사업자 정보 */}
      <footer className={styles.footer}>
        <div className={styles.policyLinks}>
          <a
            href="https://kimsuky.notion.site/HotPick-33210e0b649280bf9d4ffb6899538643"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.policyLink}
          >
            이용약관
          </a>
          <span className={styles.policyDivider}>|</span>
          <a
            href="https://kimsuky.notion.site/HotPick-33210e0b6492806f8992cef7ce933abf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.policyLink}
          >
            개인정보처리방침
          </a>
        </div>

        <div className={styles.businessInfo}>
          <p>아이티웅 | 사업자등록번호 712-47-00107</p>
          <p>주소: 경기도 성남시 분당구 성남대로 295</p>
        </div>

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
