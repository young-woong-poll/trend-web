import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Trend Web</h1>
        <p className={styles.description}>Next.js with TypeScript, SCSS, ESLint, and Prettier</p>
      </main>
    </div>
  );
}
