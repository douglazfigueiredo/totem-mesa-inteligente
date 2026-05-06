'use client';

import { useState } from 'react';
import { WaiterCallModal } from './WaiterCallModal';
import styles from './WaiterCallButton.module.css';

type Props = { variant?: 'icon' | 'pill' };

export const WaiterCallButton = ({ variant = 'icon' }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={variant === 'icon' ? styles.icon : styles.pill}
        onClick={() => setOpen(true)}
        aria-label="chamar garçom"
      >
        <span aria-hidden>🛎️</span>
        {variant === 'pill' && <span>chamar garçom</span>}
      </button>
      {open && <WaiterCallModal onClose={() => setOpen(false)} />}
    </>
  );
};
