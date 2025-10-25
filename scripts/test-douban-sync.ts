/**
 * Test Douban Sync API
 * Simulate the sync API call to see detailed errors
 */

import { PrismaClient } from "@prisma/client";
import { syncDouban } from "../src/lib/media-sync";
import { decryptCredential, isEncrypted } from "../src/lib/encryption";

const prisma = new PrismaClient();

async function testDoubanSync() {
  try {
    console.log("=== Testing Douban Sync ===\n");

    // Fetch Douban credential
    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: "DOUBAN",
        isValid: true,
      },
    });

    if (credentials.length === 0) {
      console.log("❌ No valid Douban credentials found");
      return;
    }

    const credential = credentials[0];
    console.log(`Found credential: ${credential.id}`);
    console.log(`Metadata:`, JSON.stringify(credential.metadata, null, 2));

    // Extract userId from metadata
    const metadata = credential.metadata as { userId?: string; user_id?: string } | null;
    const userId = metadata?.userId || metadata?.user_id;

    console.log(`\nExtracted userId: ${userId || "(missing)"}`);

    if (!userId) {
      console.log("\n❌ ERROR: userId not found in metadata");
      console.log("This would cause a 400 error in the API");
      return;
    }

    // Decrypt cookie value
    const cookieValue = isEncrypted(credential.value)
      ? decryptCredential(credential.value)
      : credential.value;

    console.log(`\nCookie value (decrypted): ${cookieValue.substring(0, 50)}...`);
    console.log(`Cookie length: ${cookieValue.length} chars`);

    // Test sync
    console.log(`\n=== Starting Sync ===\n`);

    const result = await syncDouban(
      {
        userId,
        cookie: cookieValue,
      },
      credential.id
    );

    console.log("\n=== Sync Result ===");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ Sync successful!`);
      console.log(`  Total items: ${result.itemsTotal}`);
      console.log(`  New items: ${result.itemsNew}`);
      console.log(`  Existing items: ${result.itemsExisting}`);
      console.log(`  Failed items: ${result.itemsFailed}`);
      console.log(`  Duration: ${result.duration}ms`);
    } else {
      console.log(`\n❌ Sync failed!`);
      console.log(`  Error: ${result.error}`);
      if (result.errorStack) {
        console.log(`  Stack:\n${result.errorStack}`);
      }
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    if (error instanceof Error) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDoubanSync();
