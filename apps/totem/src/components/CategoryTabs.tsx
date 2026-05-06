'use client';

import type { Category } from '@app/schemas';
import styles from './CategoryTabs.module.css';

type Props = {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export const CategoryTabs = ({ categories, activeId, onSelect }: Props) => (
  <div className={styles.scroll}>
    <div className={styles.row}>
      {categories.map((c) => (
        <button
          key={c.id}
          className={`${styles.tab} ${c.id === activeId ? styles.active : ''}`}
          onClick={() => onSelect(c.id)}
        >
          {c.nome}
        </button>
      ))}
    </div>
  </div>
);
