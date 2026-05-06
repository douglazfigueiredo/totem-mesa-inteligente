'use client';

import styles from './QtyStepper.module.css';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export const QtyStepper = ({ value, min = 1, max = 99, onChange }: Props) => (
  <div className={styles.row}>
    <button
      className={styles.btn}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label="diminuir"
    >
      −
    </button>
    <span className={styles.value}>{value}</span>
    <button
      className={styles.btn}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label="aumentar"
    >
      +
    </button>
  </div>
);
