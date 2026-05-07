import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, schema } from '@/db';

/**
 * NextAuth v5 configurado com Drizzle adapter.
 *
 * Stub na Fase 6A: providers vazios — login real (Email magic-link) chega
 * na Fase 6B. Adapter já mapeia owners/accounts/sessions/verificationTokens
 * pra Drizzle, e a callback de session anexa `ownerId` ao session.user.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.owners,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: 'database' },
  providers: [
    // Email({ ... }) — wire-up na Fase 6B
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        (session.user as typeof session.user & { id: string }).id = user.id;
      }
      return session;
    },
  },
});
