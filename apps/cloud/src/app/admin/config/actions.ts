'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';

const NomeSchema = z.string().trim().min(1).max(120);
const ShortText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length === 0 ? null : v));
const UrlOrEmpty = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v.length === 0 || /^https?:\/\//i.test(v), 'URL inválida')
  .transform((v) => (v.length === 0 ? null : v));

export type ConfigActionState = { ok: boolean; message: string } | null;

export async function updateTenantConfigAction(
  _prev: ConfigActionState,
  formData: FormData,
): Promise<ConfigActionState> {
  let owner;
  try {
    owner = await requireOwner();
  } catch {
    // requireOwner faz redirect — não deve cair aqui em fluxo normal
    return { ok: false, message: 'sessão expirada — entre novamente' };
  }

  const tenant = owner.activeTenant;
  if (!tenant) return { ok: false, message: 'sem tenant ativo' };

  const parsed = z
    .object({
      nome: NomeSchema,
      brand: ShortText(60),
      area: ShortText(60),
      sinceLabel: ShortText(40),
      heroImageUrl: UrlOrEmpty,
      wifiSsid: ShortText(60),
      wifiPass: ShortText(120),
    })
    .safeParse({
      nome: formData.get('nome') ?? '',
      brand: formData.get('brand') ?? '',
      area: formData.get('area') ?? '',
      sinceLabel: formData.get('sinceLabel') ?? '',
      heroImageUrl: formData.get('heroImageUrl') ?? '',
      wifiSsid: formData.get('wifiSsid') ?? '',
      wifiPass: formData.get('wifiPass') ?? '',
    });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path?.[0];
    return {
      ok: false,
      message: `${field ?? 'campo'}: ${first?.message ?? 'inválido'}`,
    };
  }

  try {
    await db
      .update(schema.tenants)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenant.id));
  } catch (err) {
    console.error('[config] falha ao salvar:', err);
    return { ok: false, message: 'falha ao salvar — tenta de novo' };
  }

  revalidatePath('/admin/config');
  revalidatePath('/admin');
  return { ok: true, message: 'config salva — totem atualiza em até 60s' };
}
