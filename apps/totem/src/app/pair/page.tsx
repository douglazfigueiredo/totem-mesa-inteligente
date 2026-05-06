'use client';

import { PairingForm } from '@/components/PairingForm';

export default function PairPage() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}
    >
      <PairingForm />
    </main>
  );
}
