'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { withFeedback, type ActionState } from '@/lib/actions';

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

export async function updateTenantConfigAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('config salva — totem atualiza em até 60s', async () => {
    const owner = await requireOwner();
    const tenant = owner.activeTenant;
    if (!tenant) throw new Error('sem tenant ativo');

    const data = z
      .object({
        nome: NomeSchema,
        brand: ShortText(60),
        area: ShortText(60),
        sinceLabel: ShortText(40),
        heroImageUrl: UrlOrEmpty,
        wifiSsid: ShortText(60),
        wifiPass: ShortText(120),
      })
      .parse({
        nome: formData.get('nome') ?? '',
        brand: formData.get('brand') ?? '',
        area: formData.get('area') ?? '',
        sinceLabel: formData.get('sinceLabel') ?? '',
        heroImageUrl: formData.get('heroImageUrl') ?? '',
        wifiSsid: formData.get('wifiSsid') ?? '',
        wifiPass: formData.get('wifiPass') ?? '',
      });

    await db
      .update(schema.tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenant.id));

    revalidatePath('/admin/config');
    revalidatePath('/admin');
  });
}
