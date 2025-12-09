import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sendVerificationEmail } from "@/lib/email/send";
import { assertRateLimit } from "@/lib/rate-limit";
import { generateVerificationCode } from "@/lib/auth/email-code";

const prismaAdapter = PrismaAdapter(prisma) as Adapter;

function getAdminEmailSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function syncUserRole(userId: string | undefined, email: string | null | undefined) {
  if (!userId || !email) {
    return UserRole.READER;
  }

  const adminEmails = getAdminEmailSet();
  const normalizedEmail = email.toLowerCase();
  const shouldBeAdmin = adminEmails.has(normalizedEmail);
  const desiredRole = shouldBeAdmin ? UserRole.ADMIN : UserRole.READER;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, emailVerified: true },
  });

  if (!existingUser) {
    return desiredRole;
  }

  const needsRoleUpdate = existingUser.role !== desiredRole;
  const needsEmailVerification = shouldBeAdmin && !existingUser.emailVerified;

  if (needsRoleUpdate || needsEmailVerification) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: desiredRole,
        ...(needsEmailVerification ? { emailVerified: new Date() } : {}),
      },
    });
  }

  return desiredRole;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  adapter: prismaAdapter,
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
      const mutableToken = token as typeof token & { roleSynced?: boolean };

      if (user?.id) {
        mutableToken.id = user.id;
        mutableToken.email = user.email ?? mutableToken.email;
        mutableToken.roleSynced = false;
      }

      if (trigger === "update") {
        mutableToken.roleSynced = false;
      }

      if (mutableToken.id && mutableToken.roleSynced !== true) {
        const dbUser = await prisma.user.findUnique({
          where: { id: mutableToken.id as string },
          select: { role: true },
        });
        mutableToken.role = dbUser?.role ?? UserRole.READER;
        mutableToken.roleSynced = true;
      } else if (!mutableToken.role) {
        mutableToken.role = UserRole.READER;
      }

      return mutableToken;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // These fields are declared in module augmentation under types/next-auth.d.ts
        session.user.id = token.id as string;
        session.user.role = (token.role ?? UserRole.READER) as UserRole;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth (Google), email is required but id may not exist on first login
      // The adapter will create the user after signIn succeeds
      if (!user?.email) {
        return false;
      }

      // Only sync role if user.id exists (returning user)
      // For new users, role sync happens in createUser event
      if (user.id) {
        await syncUserRole(user.id, user.email);
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        console.log(`ℹ️ Regular user created: ${user.email || "unknown"} (role: READER)`);
        return;
      }

      const role = await syncUserRole(user.id, user.email);
      if (role === UserRole.ADMIN) {
        console.log(`✅ Admin user created: ${user.email}`);
      } else {
        console.log(`ℹ️ Regular user created: ${user.email || "unknown"} (role: ${role})`);
      }
    },
  },
};

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
export const { GET, POST } = handlers;
export const authOptions = authConfig;

export type { NextAuthConfig };
