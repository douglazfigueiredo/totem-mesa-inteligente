'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import styles from './Welcome.module.css';

const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
};

export const Welcome = () => {
  const router = useRouter();
  const tableNumero = useAuthStore((s) => s.tableNumero);
  const clear = useAuthStore((s) => s.clear);

  return (
    <main className={`${styles.wrap} fade-up`}>
      <header className={styles.topbar}>
        <span className={styles.brand}>TotemMesa</span>
        <span className={styles.tag}>mesa {String(tableNumero ?? '?').padStart(2, '0')}</span>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.headline}>
          {greeting()},<br />
          <em>mesa {String(tableNumero ?? '?').padStart(2, '0')}</em>
        </h1>
        <p className={styles.subtitle}>o que vai pedir hoje? toque pra ver o cardápio.</p>
        <button className="btn btn-primary" onClick={() => router.push('/menu')}>
          ver cardápio →
        </button>
      </section>

      <footer className={styles.footer}>
        <button className={styles.linkBtn} onClick={clear}>
          desemparelhar (debug)
        </button>
      </footer>
    </main>
  );
};
