import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, schema } from '@/db';
import { sendMagicLinkEmail } from './email/magic-link';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.owners,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: 'database' },
  trustHost: true,
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: sendMagicLinkEmail,
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
    error: '/login',
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
