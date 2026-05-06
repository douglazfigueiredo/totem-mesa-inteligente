'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Modifier,
  ModifierGroup,
  ModifierGroupId,
  ModifierId,
  Product,
  ProductVariant,
  ProductVariantId,
} from '@app/schemas';
import { useCartStore } from '@/lib/cart-store';
import { formatBRL, formatDeltaBRL } from '@/lib/format';
import { QtyStepper } from './QtyStepper';
import styles from './ProductDetail.module.css';

type Props = { product: Product };

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

export const ProductDetail = ({ product }: Props) => {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.add);

  const initialVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null;
  const [variantId, setVariantId] = useState<ProductVariantId | null>(initialVariant?.id ?? null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierId[]>>({});
  const [obs, setObs] = useState('');
  const [qty, setQty] = useState(1);

  const variant: ProductVariant | null = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product.variants, variantId],
  );

  const variantPrice = variant?.priceCents ?? product.basePriceCents;

  const modifiersTotal = useMemo(() => {
    let sum = 0;
    for (const group of product.modifierGroups) {
      const ids = selectedModifiers[group.id] ?? [];
      for (const m of group.modifiers) {
        if (ids.includes(m.id)) sum += m.priceDeltaCents;
      }
    }
    return sum;
  }, [product.modifierGroups, selectedModifiers]);

  const unitPriceCents = variantPrice + modifiersTotal;
  const totalPriceCents = unitPriceCents * qty;

  const toggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const cur = prev[group.id] ?? [];
      const already = cur.includes(modifier.id);
      let next: ModifierId[];
      if (group.selectionType === 'single') {
        next = already ? [] : [modifier.id];
      } else {
        next = already ? cur.filter((id) => id !== modifier.id) : [...cur, modifier.id];
      }
      return { ...prev, [group.id]: next };
    });
  };

  const requirementsMet = product.modifierGroups.every((g) => {
    if (!g.required) return true;
    const cur = selectedModifiers[g.id] ?? [];
    if (cur.length < g.minSelect) return false;
    if (g.maxSelect && cur.length > g.maxSelect) return false;
    return true;
  });

  const handleAdd = () => {
    if (!requirementsMet) return;
    const customizationModifiers = product.modifierGroups
      .map((g) => ({
        groupId: g.id as ModifierGroupId,
        modifierIds: (selectedModifiers[g.id] ?? []) as ModifierId[],
      }))
      .filter((g) => g.modifierIds.length > 0);

    addToCart({
      productId: product.id,
      nome: variant ? `${product.nome} (${variant.nome})` : product.nome,
      destino: product.destino,
      qty,
      unitPriceCents,
      totalPriceCents,
      tempoEstimadoSec: product.tempoEstimadoSec,
      variantId: variant?.id,
      variantNome: variant?.nome,
      customization:
        customizationModifiers.length > 0 || obs
          ? {
              variantId: variant?.id,
              modifiers: customizationModifiers,
              obs: obs || undefined,
            }
          : undefined,
      imageUrl: product.imageUrl,
    });
    router.push('/menu');
  };

  return (
    <article className={`${styles.wrap} fade-up`}>
      <div className={styles.media}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.nome} className={styles.image} />
        ) : (
          <span className={styles.emoji}>{productEmoji(product)}</span>
        )}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <h1 className={styles.name}>{product.nome}</h1>
          {product.descricao && <p className={styles.desc}>{product.descricao}</p>}
        </header>

        {product.variants.length > 0 && (
          <Section title="tamanho">
            <div className={styles.options}>
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  className={`${styles.option} ${v.id === variantId ? styles.selected : ''}`}
                  onClick={() => setVariantId(v.id)}
                  disabled={!v.isAvailable}
                >
                  <span>{v.nome}</span>
                  <span className={styles.optionPrice}>{formatBRL(v.priceCents)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {product.modifierGroups.map((group) => (
          <Section
            key={group.id}
            title={group.nome}
            hint={
              group.required
                ? `obrigatório (${group.minSelect}${group.maxSelect ? `–${group.maxSelect}` : '+'})`
                : group.selectionType === 'single'
                  ? 'opcional'
                  : 'opcionais'
            }
          >
            <div className={styles.options}>
              {group.modifiers
                .filter((m) => m.isAvailable)
                .map((m) => {
                  const selected = (selectedModifiers[group.id] ?? []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      className={`${styles.option} ${selected ? styles.selected : ''}`}
                      onClick={() => toggleModifier(group, m)}
                    >
                      <span>{m.nome}</span>
                      {m.priceDeltaCents !== 0 && (
                        <span className={styles.optionDelta}>
                          {formatDeltaBRL(m.priceDeltaCents)}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </Section>
        ))}

        <Section title="observações">
          <textarea
            className={styles.textarea}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="ex: sem cebola, ponto da carne, alergia, etc."
            maxLength={500}
            rows={3}
          />
        </Section>

        <div className={styles.footer}>
          <QtyStepper value={qty} onChange={setQty} />
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!requirementsMet}
            style={{ flex: 1 }}
          >
            adicionar — {formatBRL(totalPriceCents)}
          </button>
        </div>
      </div>
    </article>
  );
};

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className={styles.section}>
    <header className={styles.sectionHead}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {hint && <span className="mono-label">{hint}</span>}
    </header>
    {children}
  </section>
);
