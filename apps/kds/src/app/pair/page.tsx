'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isPaired } from '@/lib/auth-store';
import { PairingForm } from '@/components/PairingForm';

export default function PairPage() {
  const router = useRouter();
  const paired = useAuthStore(isPaired);

  useEffect(() => {
    if (paired) router.replace('/');
  }, [paired, router]);

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <PairingForm />
    </main>
  );
}
