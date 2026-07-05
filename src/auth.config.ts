import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export function applyTokenToSession(session: Session, token: JWT): Session {
  if (session.user) {
    session.user.id = token.id as string;
  }
  return session;
}

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      } else if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
