/**
 * Debug Douban Credential
 * Check credential data structure in database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugDoubanCredential() {
  try {
    console.log("=== Checking Douban Credentials ===\n");

    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: "DOUBAN",
      },
      select: {
        id: true,
        platform: true,
        value: true,
        metadata: true,
        isValid: true,
        createdAt: true,
      },
    });

    if (credentials.length === 0) {
      console.log("❌ No Douban credentials found in database");
      return;
    }

    console.log(`Found ${credentials.length} Douban credential(s):\n`);

    for (const cred of credentials) {
      console.log(`Credential ID: ${cred.id}`);
      console.log(`  Platform: ${cred.platform}`);
      console.log(`  Is Valid: ${cred.isValid}`);
      console.log(`  Value (first 50 chars): ${cred.value.substring(0, 50)}...`);
      console.log(`  Value length: ${cred.value.length} chars`);

      // Parse metadata
      console.log(`  Metadata:`, JSON.stringify(cred.metadata, null, 2));

      const metadata = cred.metadata as { userId?: string; user_id?: string } | null;
      if (metadata) {
        const userId = metadata.userId || metadata.user_id;
        console.log(`  ✓ Extracted userId from metadata: ${userId || "(missing)"}`);
      } else {
        console.log(`  ❌ Metadata is null or invalid`);
      }

      console.log(`  Created: ${cred.createdAt}`);
      console.log("");
    }
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugDoubanCredential();
