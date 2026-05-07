'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { EmployeeRole } from '@app/schemas';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { withFeedback, type ActionState } from '@/lib/actions';
import { generatePin, hashPin } from '@/lib/pin';

const NomeSchema = z.string().trim().min(1, 'nome obrigatório').max(80);
const IdSchema = z.string().uuid();
const RolesSchema = z
  .array(EmployeeRole)
  .min(1, 'escolha pelo menos uma função');

async function activeTenantOrFail() {
  const owner = await requireOwner();
  if (!owner.activeTenant) throw new Error('sem tenant ativo');
  return owner.activeTenant;
}

function parseRoles(formData: FormData): string[] {
  return RolesSchema.parse(formData.getAll('roles'));
}

export async function createEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('funcionário criado', async () => {
    const tenant = await activeTenantOrFail();
    const nome = NomeSchema.parse(formData.get('nome'));
    const roles = parseRoles(formData);
    const pin = generatePin();

    await db.insert(schema.employees).values({
      tenantId: tenant.id,
      nome,
      roles,
      pinHash: hashPin(pin),
    });

    revalidatePath('/admin/funcionarios');
    return `${nome} criado · PIN: ${pin}`;
  });
}

export async function updateEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('funcionário atualizado', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));
    const nome = NomeSchema.parse(formData.get('nome'));
    const roles = parseRoles(formData);

    await db
      .update(schema.employees)
      .set({ nome, roles, updatedAt: new Date() })
      .where(and(eq(schema.employees.id, id), eq(schema.employees.tenantId, tenant.id)));

    revalidatePath('/admin/funcionarios');
  });
}

export async function regeneratePinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('PIN regenerado', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));
    const pin = generatePin();

    const result = await db
      .update(schema.employees)
      .set({ pinHash: hashPin(pin), updatedAt: new Date() })
      .where(and(eq(schema.employees.id, id), eq(schema.employees.tenantId, tenant.id)))
      .returning({ nome: schema.employees.nome });
    if (!result[0]) throw new Error('funcionário não encontrado');

    revalidatePath('/admin/funcionarios');
    return `${result[0].nome} · novo PIN: ${pin}`;
  });
}

export async function toggleEmployeeActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));

    await db
      .update(schema.employees)
      .set({
        isActive: sql`NOT ${schema.employees.isActive}`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.employees.id, id), eq(schema.employees.tenantId, tenant.id)));

    revalidatePath('/admin/funcionarios');
  });
}

export async function deleteEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('funcionário removido', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));

    await db
      .delete(schema.employees)
      .where(and(eq(schema.employees.id, id), eq(schema.employees.tenantId, tenant.id)));

    revalidatePath('/admin/funcionarios');
  });
}
