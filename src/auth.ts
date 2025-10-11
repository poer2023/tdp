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
      // 从环境变量读取管理员邮箱白名单
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      // 检查新用户是否在白名单中
      if (user.id && user.email && adminEmails.includes(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
        });
        console.log(`✅ Admin user created: ${user.email}`);
      } else {
        console.log(`ℹ️ Regular user created: ${user.email || "unknown"} (role: AUTHOR)`);
      }
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export type { NextAuthOptions };
