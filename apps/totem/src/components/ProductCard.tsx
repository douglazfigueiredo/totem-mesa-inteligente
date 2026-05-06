'use client';

import type { Product } from '@app/schemas';
import { formatBRL } from '@/lib/format';
import styles from './ProductCard.module.css';

type Props = {
  product: Product;
  onClick: () => void;
};

const productEmoji = (p: Product): string => {
  const tipo = p.verticalConfig?.tipo;
  if (tipo === 'pizza') return '🍕';
  if (tipo === 'lanche') return '🍔';
  if (tipo === 'prato') return '🍽️';
  if (tipo === 'bebida') return '🥤';
  if (tipo === 'sobremesa') return '🍰';
  if (tipo === 'salgado') return '🥐';
  return '🍴';
};

export const ProductCard = ({ product, onClick }: Props) => {
  const startPrice = product.variants[0]?.priceCents ?? product.basePriceCents;

  return (
    <button className={styles.card} onClick={onClick} disabled={!product.isAvailable}>
      <div className={styles.media}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.nome} className={styles.image} />
        ) : (
          <span className={styles.emoji}>{productEmoji(product)}</span>
        )}
        <div className={styles.badges}>
          {product.isVegetarian && <span className={styles.badge}>vegetariano</span>}
          {product.isGlutenFree && <span className={styles.badge}>sem glúten</span>}
          {!product.isAvailable && (
            <span className={`${styles.badge} ${styles.badgeOff}`}>esgotado</span>
          )}
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.nome}</h3>
        {product.descricao && <p className={styles.desc}>{product.descricao}</p>}
        <div className={styles.priceRow}>
          {product.variants.length > 1 && <span className={styles.from}>a partir de</span>}
          <span className={styles.price}>{formatBRL(startPrice)}</span>
        </div>
      </div>
    </button>
  );
};
