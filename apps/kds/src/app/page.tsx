'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isPaired, isLoggedIn } from '@/lib/auth-store';
import { TopBar } from '@/components/TopBar';
import { TicketGrid } from '@/components/TicketGrid';

export default function HomePage() {
  const router = useRouter();
  const paired = useAuthStore(isPaired);
  const logged = useAuthStore(isLoggedIn);

  useEffect(() => {
    if (!paired) router.replace('/pair');
    else if (!logged) router.replace('/login');
  }, [paired, logged, router]);

  if (!paired || !logged) return null;

  return (
    <>
      <TopBar />
      <main style={{ flex: 1 }}>
        <TicketGrid />
      </main>
    </>
  );
}
