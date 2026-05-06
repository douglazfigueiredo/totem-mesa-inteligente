import { z } from 'zod';

export const PriceCents = z.number().int().nonnegative();
export type PriceCents = z.infer<typeof PriceCents>;

export const PriceDeltaCents = z.number().int();
export type PriceDeltaCents = z.infer<typeof PriceDeltaCents>;

export const Bps = z.number().int().min(0).max(10000);
export type Bps = z.infer<typeof Bps>;

export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const applyBps = (cents: number, bps: number): number =>
  Math.round((cents * bps) / 10000);
