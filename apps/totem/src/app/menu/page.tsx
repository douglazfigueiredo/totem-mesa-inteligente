'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isPaired, useAuthStore } from '@/lib/auth-store';
import { useCatalog } from '@/lib/catalog-store';
import { MenuLayout } from '@/components/MenuLayout';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ProductCard } from '@/components/ProductCard';
import styles from './page.module.css';

export default function MenuPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) router.replace('/pair');
  }, [hydrated, auth, router]);

  const { snapshot, loading, error } = useCatalog();

  const sections = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.categories]
      .sort((a, b) => a.ordem - b.ordem)
      .filter((c) => c.isActive)
      .map((cat) => ({
        category: cat,
        products: snapshot.products.filter((p) => p.categoryId === cat.id),
      }));
  }, [snapshot]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!activeId && sections[0]) setActiveId(sections[0].category.id);
  }, [sections, activeId]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!hydrated || !isPaired(auth)) return <main style={{ flex: 1 }} />;

  return (
    <MenuLayout>
      {loading && !snapshot && <p className={styles.loading}>carregando cardápio...</p>}
      {error && <p className={styles.error}>erro: {error}</p>}
      {snapshot && (
        <>
          <CategoryTabs
            categories={sections.map((s) => s.category)}
            activeId={activeId}
            onSelect={handleSelect}
          />
          <div className={styles.feed}>
            {sections.map(({ category, products }) => (
              <section
                key={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className={styles.section}
              >
                <h2 className={styles.sectionTitle}>{category.nome}</h2>
                <div className={styles.grid}>
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onClick={() => router.push(`/menu/${p.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </MenuLayout>
  );
}
