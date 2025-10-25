/**
 * Fix Douban Credential Metadata
 * Add userId to metadata if missing
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDoubanMetadata() {
  try {
    console.log("=== Checking Douban Credentials for Missing userId ===\n");

    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: "DOUBAN",
      },
    });

    console.log(`Found ${credentials.length} Douban credential(s)\n`);

    let fixed = 0;
    let already_ok = 0;

    for (const cred of credentials) {
      const metadata = cred.metadata as { userId?: string; user_id?: string } | null;
      const userId = metadata?.userId || metadata?.user_id;

      console.log(`Credential: ${cred.id}`);
      console.log(`  Current metadata:`, JSON.stringify(metadata, null, 2));
      console.log(`  Extracted userId: ${userId || "(missing)"}`);

      if (!userId) {
        console.log(`  ❌ Missing userId - needs manual intervention`);
        console.log(`  Action required: Add userId to this credential's metadata`);
        console.log(`  Suggested fix: Update metadata to include either 'userId' or 'user_id' field`);
        console.log(``);
        fixed++;
      } else {
        console.log(`  ✅ userId present: ${userId}`);
        already_ok++;

        // Normalize to use 'user_id' format for consistency
        if (metadata && !metadata.user_id && metadata.userId) {
          console.log(`  📝 Normalizing: converting 'userId' to 'user_id' format`);
          const updated_metadata = {
            ...metadata,
            user_id: metadata.userId,
          };
          delete updated_metadata.userId;

          await prisma.externalCredential.update({
            where: { id: cred.id },
            data: { metadata: updated_metadata },
          });
          console.log(`  ✅ Normalized metadata`);
        }
      }
      console.log("");
    }

    console.log("=== Summary ===");
    console.log(`Total credentials: ${credentials.length}`);
    console.log(`Already correct: ${already_ok}`);
    console.log(`Need manual fix: ${fixed}`);

    if (fixed > 0) {
      console.log(`\n⚠️  ${fixed} credential(s) need manual userId addition`);
      console.log(
        `Run this SQL to add userId (replace 'YOUR_DOUBAN_USER_ID' with actual value):`
      );
      console.log(
        `UPDATE "ExternalCredential" SET metadata = jsonb_set(metadata, '{user_id}', '"YOUR_DOUBAN_USER_ID"') WHERE platform = 'DOUBAN' AND (metadata->>'user_id') IS NULL;`
      );
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

fixDoubanMetadata();
