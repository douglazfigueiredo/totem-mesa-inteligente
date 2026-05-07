'use client';

import { primeAudio, useSoundStore } from '@/lib/sound';
import styles from './SoundToggle.module.css';

export const SoundToggle = () => {
  const enabled = useSoundStore((s) => s.enabled);
  const toggle = useSoundStore((s) => s.toggle);

  const handleClick = () => {
    primeAudio();
    toggle();
  };

  return (
    <button
      type="button"
      className={`${styles.btn} ${enabled ? styles.on : styles.off}`}
      onClick={handleClick}
      title={enabled ? 'desligar som' : 'ligar som'}
      aria-label={enabled ? 'desligar som' : 'ligar som'}
    >
      {enabled ? '🔔' : '🔕'}
    </button>
  );
};
