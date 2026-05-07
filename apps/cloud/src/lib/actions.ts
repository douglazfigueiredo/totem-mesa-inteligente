import { ZodError } from 'zod';

/**
 * Estado retornado por toda server action. Compatível com `useActionState`
 * do React 19 e consumido pelo `<ToastForm>` no cliente.
 */
export type ActionState = { ok: boolean; message: string } | null;

/**
 * Wrap a server action body com feedback estruturado:
 * - sucesso → { ok: true, message }
 * - ZodError → { ok: false, message: '<campo>: <mensagem>' }
 * - Error → { ok: false, message: err.message }
 * - resto → { ok: false, message: 'erro ao processar' }
 *
 * Use o `successMessage = null` quando a ação não precisa de feedback positivo
 * (move ↑/↓, toggle availability, etc) — o `<ToastForm silentOnSuccess>` decide
 * exibir ou não.
 */
export async function withFeedback(
  successMessage: string,
  fn: () => Promise<void>,
): Promise<ActionState> {
  try {
    await fn();
    return { ok: true, message: successMessage };
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      const path = issue?.path?.[0];
      return {
        ok: false,
        message: `${path ?? 'campo'}: ${issue?.message ?? 'inválido'}`,
      };
    }
    if (err instanceof Error && err.message) {
      return { ok: false, message: err.message };
    }
    console.error('[action]', err);
    return { ok: false, message: 'erro ao processar' };
  }
}
