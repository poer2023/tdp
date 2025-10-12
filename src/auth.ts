import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sendVerificationEmail } from "@/lib/email/send";
import { assertRateLimit } from "@/lib/rate-limit";
import { generateVerificationCode } from "@/lib/auth/email-code";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      },
      from: process.env.EMAIL_FROM!,
      // Custom token generation - use 6-digit code instead of long token
      generateVerificationToken: () => {
        const codeLength = parseInt(process.env.VERIFICATION_CODE_LENGTH || "6", 10);
        return generateVerificationCode(codeLength);
      },
      // Custom email sending with rate limiting
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        try {
          // Rate limiting: 5 emails per 15 minutes per email address
          await assertRateLimit(`auth:email:${email}`, 5, 15 * 60 * 1000);

          // Send verification email with code
          await sendVerificationEmail({
            to: email,
            verificationCode: token,
            loginUrl: url,
            locale: "zh", // TODO: detect user locale
          });

          console.log(`✅ Verification code sent to ${email}`);
        } catch (error) {
          console.error(`❌ Failed to send verification code to ${email}:`, error);
          throw error;
        }
      },
      // Set token expiry (default is 24 hours, we want 10 minutes)
      maxAge: parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || "10", 10) * 60,
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
        token.role = dbUser?.role ?? UserRole.READER;
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
        session.user.role = (token.role ?? UserRole.READER) as UserRole;
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
        .filter(Boolean)
        .map((email) => email.toLowerCase());

      // 检查新用户是否在白名单中
      if (user.id && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        const isAdmin = adminEmails.includes(normalizedEmail);

        await prisma.user.update({
          where: { id: user.id },
          data: { role: isAdmin ? UserRole.ADMIN : UserRole.READER },
        });
        if (isAdmin) {
          console.log(`✅ Admin user created: ${user.email}`);
        } else {
          console.log(`ℹ️ Regular user created: ${user.email} (role: READER)`);
        }
      } else {
        console.log(`ℹ️ Regular user created: ${user.email || "unknown"} (role: READER)`);
      }
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export type { NextAuthOptions };
