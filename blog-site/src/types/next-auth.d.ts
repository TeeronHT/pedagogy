import NextAuth, { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: DefaultSession["user"] & {
      id: string;
      role?: UserRole;
    };
  }

  interface User {
    role?: UserRole;
  }
}

