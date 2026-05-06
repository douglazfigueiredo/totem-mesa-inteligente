'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isPaired } from '@/lib/auth-store';
import { Welcome } from '@/components/Welcome';

export default function HomePage() {
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) {
      router.replace('/pair');
    }
  }, [hydrated, auth, router]);

  if (!hydrated || !isPaired(auth)) {
    return <main style={{ flex: 1 }} />;
  }

  return <Welcome />;
}
