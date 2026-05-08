'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isPaired, isLoggedIn } from '@/lib/auth-store';
import { PinForm } from '@/components/PinForm';

export default function LoginPage() {
  const router = useRouter();
  const paired = useAuthStore(isPaired);
  const logged = useAuthStore(isLoggedIn);

  useEffect(() => {
    if (!paired) router.replace('/pair');
    else if (logged) router.replace('/');
  }, [paired, logged, router]);

  if (!paired) return null;
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <PinForm />
    </main>
  );
}
