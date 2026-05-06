'use client';

import { useMemo, use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isPaired, useAuthStore } from '@/lib/auth-store';
import { useCatalog } from '@/lib/catalog-store';
import { MenuLayout } from '@/components/MenuLayout';
import { ProductDetail } from '@/components/ProductDetail';

export default function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) router.replace('/pair');
  }, [hydrated, auth, router]);

  const { snapshot, loading } = useCatalog();
  const product = useMemo(
    () => snapshot?.products.find((p) => p.id === productId) ?? null,
    [snapshot, productId],
  );

  if (!hydrated || !isPaired(auth)) return <main style={{ flex: 1 }} />;

  return (
    <MenuLayout>
      {loading && !snapshot && (
        <p style={{ padding: 28, textAlign: 'center', color: 'var(--ink-mute)' }}>carregando...</p>
      )}
      {snapshot && !product && (
        <p style={{ padding: 28, textAlign: 'center' }}>produto não encontrado.</p>
      )}
      {product && <ProductDetail product={product} />}
    </MenuLayout>
  );
}
