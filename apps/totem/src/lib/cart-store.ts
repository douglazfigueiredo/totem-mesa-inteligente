'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemCustomization, ItemDestino, ProductId, ProductVariantId } from '@app/schemas';

export type CartItem = {
  lineId: string;
  productId: ProductId;
  nome: string;
  destino: ItemDestino;
  qty: number;
  unitPriceCents: number;
  totalPriceCents: number;
  tempoEstimadoSec: number;
  variantId?: ProductVariantId;
  variantNome?: string;
  customization?: ItemCustomization;
  imageUrl?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'lineId'>) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const newLineId = () =>
  globalThis.crypto?.randomUUID?.() ?? `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, lineId: newLineId() }],
        })),
      setQty: (lineId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.lineId === lineId
              ? {
                  ...i,
                  qty: Math.max(1, Math.min(99, qty)),
                  totalPriceCents: i.unitPriceCents * Math.max(1, Math.min(99, qty)),
                }
              : i,
          ),
        })),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'tm-totem-cart',
      version: 1,
    },
  ),
);

export const cartSubtotalCents = (items: CartItem[]): number =>
  items.reduce((s, i) => s + i.totalPriceCents, 0);

export const cartItemCount = (items: CartItem[]): number => items.reduce((s, i) => s + i.qty, 0);
