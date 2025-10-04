import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, add user info to token
      if (user) {
        token.id = user.id;
        // Fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? UserRole.AUTHOR;
      }

      // On session update, refresh role from database
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // These fields are declared in module augmentation under types/next-auth.d.ts
        session.user.id = token.id as string;
        session.user.role = (token.role ?? UserRole.AUTHOR) as UserRole;
      }
      return session;
    },
    async signIn({ user }) {
      // Just verify user has email, actual role assignment happens in createUser event
      return !!user?.email;
    },
  },
  events: {
    async createUser({ user }) {
      // Check if this is the first user (no admin exists yet)
      const adminExists = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      // If no admin exists, promote this newly created user to ADMIN
      if (!adminExists && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
        });
      }
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export type { NextAuthOptions };
