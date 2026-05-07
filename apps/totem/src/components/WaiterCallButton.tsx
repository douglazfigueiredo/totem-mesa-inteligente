'use client';

import { useState } from 'react';
import { WaiterCallModal } from './WaiterCallModal';
import styles from './WaiterCallButton.module.css';

type Props = { variant?: 'icon' | 'pill' | 'text' };

export const WaiterCallButton = ({ variant = 'icon' }: Props) => {
  const [open, setOpen] = useState(false);

  const cls = variant === 'icon' ? styles.icon : variant === 'pill' ? styles.pill : styles.text;

  return (
    <>
      <button className={cls} onClick={() => setOpen(true)} aria-label="chamar garçom">
        <span aria-hidden>🛎</span>
        {variant !== 'icon' && <span>{variant === 'pill' ? 'chamar garçom' : 'garçom'}</span>}
      </button>
      {open && <WaiterCallModal onClose={() => setOpen(false)} />}
    </>
  );
};
