import { z } from 'zod';

export const Vertical = z.enum(['pizzaria', 'restaurante', 'lanchonete', 'hamburgueria']);
export type Vertical = z.infer<typeof Vertical>;

export const PontoDaCarne = z.enum(['mal', 'medio', 'bem', 'mal_passado', 'ao_ponto']);
export type PontoDaCarne = z.infer<typeof PontoDaCarne>;

const PizzariaConfig = z.object({
  tipo: z.literal('pizza'),
  saboresMax: z.number().int().min(1).max(4).default(2),
  bordaRecheadaDisponivel: z.boolean().default(false),
});

const HamburgueriaConfig = z.object({
  tipo: z.literal('lanche'),
  pontoDaCarneDisponivel: z.array(PontoDaCarne).default([]),
});

const RestauranteConfig = z.object({
  tipo: z.literal('prato'),
  acompanhamentoObrigatorio: z.boolean().default(false),
});

const LanchoneteConfig = z.object({
  tipo: z.literal('salgado'),
});

const BebidaConfig = z.object({
  tipo: z.literal('bebida'),
});

const SobremesaConfig = z.object({
  tipo: z.literal('sobremesa'),
});

const SimplesConfig = z.object({
  tipo: z.literal('simples'),
});

export const VerticalConfig = z.discriminatedUnion('tipo', [
  PizzariaConfig,
  HamburgueriaConfig,
  RestauranteConfig,
  LanchoneteConfig,
  BebidaConfig,
  SobremesaConfig,
  SimplesConfig,
]);
export type VerticalConfig = z.infer<typeof VerticalConfig>;

export const TenantFeatures = z.object({
  mesas: z.boolean().default(true),
  comanda: z.boolean().default(false),
  balcao: z.boolean().default(false),
  retirada: z.boolean().default(false),
  delivery: z.boolean().default(false),
  pizzaMetade: z.boolean().default(false),
  combo: z.boolean().default(false),
});
export type TenantFeatures = z.infer<typeof TenantFeatures>;
