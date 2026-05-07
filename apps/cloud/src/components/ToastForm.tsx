'use client';

import { useActionState, useEffect, type ComponentProps } from 'react';
import { useToastStore } from './Toaster';
import type { ActionState } from '@/lib/actions';

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export type ToastFormProps = Omit<ComponentProps<'form'>, 'action'> & {
  action: ServerAction;
  /** Quando true, sucesso fica silencioso (toast só em erro). Bom pra micro-ações. */
  silentOnSuccess?: boolean;
  /** Quando true, erro fica silencioso (raro — só pra ações best-effort). */
  silentOnError?: boolean;
};

/**
 * `<form>` client wrapper que recebe uma server action no formato
 * `(prev, formData) => Promise<ActionState>` e dispara um toast com base
 * no resultado. Drop-in para qualquer formulário existente.
 */
export function ToastForm({
  action,
  silentOnSuccess = false,
  silentOnError = false,
  children,
  ...rest
}: ToastFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    if (!state) return;
    // Sucesso silencioso quando a action retorna message vazia (move, toggle…)
    if (state.ok && !silentOnSuccess && state.message) push('success', state.message);
    if (!state.ok && !silentOnError) push('error', state.message);
  }, [state, push, silentOnSuccess, silentOnError]);

  return (
    <form action={formAction} {...rest}>
      {children}
    </form>
  );
}
