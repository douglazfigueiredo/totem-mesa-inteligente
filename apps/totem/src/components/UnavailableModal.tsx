'use client';

import { useMemo } from 'react';
import { useOrdersStore } from '@/lib/orders-store';
import { useCatalogStore } from '@/lib/catalog-store';
import { useCartStore } from '@/lib/cart-store';
import styles from './UnavailableModal.module.css';

export const UnavailableModal = () => {
  const queue = useOrdersStore((s) => s.unavailableQueue);
  const dismiss = useOrdersStore((s) => s.dismissUnavailable);
  const snapshot = useCatalogStore((s) => s.snapshot);
  const cartItems = useCartStore((s) => s.items);
  const removeCartItem = useCartStore((s) => s.remove);

  const top = queue[0] ?? null;

  const product = useMemo(() => {
    if (!top || !snapshot) return null;
    return snapshot.products.find((p) => p.id === top.productId) ?? null;
  }, [top, snapshot]);

  const substitutes = useMemo(() => {
    if (!top || !snapshot) return [];
    return top.suggestedSubstitutes
      .map((id) => snapshot.products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [top, snapshot]);

  const affectedCartLines = useMemo(() => {
    if (!top) return [];
    return cartItems.filter((i) => i.productId === top.productId);
  }, [top, cartItems]);

  if (!top) return null;

  const productName = product?.nome ?? 'um item do seu pedido';

  return (
    <div className={`${styles.overlay} fade-up`} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <span className={styles.icon}>😕</span>
        <h2 className={styles.title}>{productName} esgotou</h2>
        <p className={styles.subtitle}>
          a cozinha avisou que esse item acabou. desculpe pelo inconveniente!
        </p>

        {affectedCartLines.length > 0 && (
          <div className={styles.affected}>
            <span className="mono-label">no seu carrinho</span>
            <ul>
              {affectedCartLines.map((line) => (
                <li key={line.lineId}>
                  {line.qty}× {line.nome}
                  <button className={styles.removeBtn} onClick={() => removeCartItem(line.lineId)}>
                    remover
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {substitutes.length > 0 && (
          <div className={styles.subs}>
            <span className="mono-label">sugestões</span>
            <ul>
              {substitutes.map((s) => (
                <li key={s.id}>{s.nome}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={() => dismiss(top.productId)}
          style={{ width: '100%' }}
        >
          ok, entendi
        </button>
      </div>
    </div>
  );
};
