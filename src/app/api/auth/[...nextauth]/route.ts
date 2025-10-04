import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// NextAuth + Prisma requires the Node.js runtime
export const runtime = "nodejs";
