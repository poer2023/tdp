/**
 * Fix Douban Credential Metadata
 * Add userId to metadata if missing by validating the credential
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { validateCredential } from "../src/lib/credential-validation";
import { isEncrypted, decryptCredential } from "../src/lib/encryption";

const prisma = new PrismaClient();

async function fixDoubanMetadata() {
  try {
    console.log("=== Fixing Douban Credentials with Missing userId ===\n");

    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: "DOUBAN",
      },
    });

    console.log(`Found ${credentials.length} Douban credential(s)\n`);

    let fixed = 0;
    let already_ok = 0;
    let validation_failed = 0;
    let extraction_failed = 0;

    for (const cred of credentials) {
      const metadata = cred.metadata as { userId?: string; user_id?: string } | null;
      const userId = metadata?.userId || metadata?.user_id;

      console.log(`Credential: ${cred.id}`);
      console.log(`  Current metadata:`, JSON.stringify(metadata, null, 2));
      console.log(`  Extracted userId: ${userId || "(missing)"}`);

      if (!userId) {
        console.log(`  ❌ Missing userId - attempting automatic extraction...`);

        try {
          // Decrypt credential value if needed
          const credentialValue = isEncrypted(cred.value)
            ? decryptCredential(cred.value)
            : cred.value;

          // Validate credential (this will also extract userId)
          console.log(`  🔍 Validating credential to extract userId...`);
          const validationResult = await validateCredential(
            cred.platform,
            cred.type,
            credentialValue
          );

          if (validationResult.isValid && validationResult.metadata?.userId) {
            const extractedUserId = validationResult.metadata.userId as string;
            console.log(`  ✅ Successfully extracted userId: ${extractedUserId}`);

            // Update metadata with extracted userId
            const updatedMetadata = {
              ...(metadata || {}),
              userId: extractedUserId,
              extractionMethod: validationResult.metadata.extractionMethod as string,
              extractedAt: new Date().toISOString(),
            };

            await prisma.externalCredential.update({
              where: { id: cred.id },
              data: {
                metadata: updatedMetadata as Prisma.InputJsonValue,
                isValid: true,
                lastValidatedAt: new Date(),
              },
            });

            console.log(`  💾 Updated metadata with userId: ${extractedUserId}`);
            fixed++;
          } else if (validationResult.isValid) {
            console.log(`  ⚠️  Credential is valid but userId extraction failed`);
            console.log(`  Validation message: ${validationResult.message}`);
            console.log(`  Manual intervention required`);
            extraction_failed++;
          } else {
            console.log(`  ❌ Credential validation failed: ${validationResult.error}`);
            validation_failed++;
          }
        } catch (error) {
          console.error(`  💥 Error during validation:`, error);
          validation_failed++;
        }
      } else {
        console.log(`  ✅ userId present: ${userId}`);
        already_ok++;

        // Normalize to use 'userId' format for consistency
        if (metadata && !metadata.userId && metadata.user_id) {
          console.log(`  📝 Normalizing: converting 'user_id' to 'userId' format`);
          const updated_metadata = {
            ...metadata,
            userId: metadata.user_id,
          };

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
    console.log(`Auto-fixed: ${fixed}`);
    console.log(`Validation failed: ${validation_failed}`);
    console.log(`Extraction failed: ${extraction_failed}`);

    if (validation_failed > 0 || extraction_failed > 0) {
      console.log(`\n⚠️  ${validation_failed + extraction_failed} credential(s) need manual intervention`);
      console.log(`Please check the credential cookies and re-validate them`);
    } else if (fixed > 0) {
      console.log(`\n✅ Successfully auto-fixed ${fixed} credential(s)`);
    } else {
      console.log(`\n✅ All credentials are correct`);
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
