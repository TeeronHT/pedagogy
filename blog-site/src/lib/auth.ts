import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "./prisma";
import type { UserRole } from "./roles";

const DEFAULT_ROLE: UserRole = "CONTRIBUTOR";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? session.user.id;
        session.user.role = (token.role as UserRole | undefined) ?? DEFAULT_ROLE;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        (token as JWT & { role?: UserRole }).role =
          (user.role as UserRole | undefined) ?? DEFAULT_ROLE;
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET,
};

