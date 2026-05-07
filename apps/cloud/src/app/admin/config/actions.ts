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

export async function updateTenantConfigAction(formData: FormData) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');

  const nome = NomeSchema.parse(formData.get('nome'));
  const brand = ShortText(60).parse(formData.get('brand') ?? '');
  const area = ShortText(60).parse(formData.get('area') ?? '');
  const sinceLabel = ShortText(40).parse(formData.get('sinceLabel') ?? '');
  const heroImageUrl = UrlOrEmpty.parse(formData.get('heroImageUrl') ?? '');
  const wifiSsid = ShortText(60).parse(formData.get('wifiSsid') ?? '');
  const wifiPass = ShortText(120).parse(formData.get('wifiPass') ?? '');

  await db
    .update(schema.tenants)
    .set({
      nome,
      brand,
      area,
      sinceLabel,
      heroImageUrl,
      wifiSsid,
      wifiPass,
      updatedAt: new Date(),
    })
    .where(eq(schema.tenants.id, tenant.id));

  revalidatePath('/admin/config');
  revalidatePath('/admin');
}
