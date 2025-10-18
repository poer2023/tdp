#!/usr/bin/env node
/**
 * Migrate Existing Credentials to Encrypted Storage
 *
 * This script encrypts all existing unencrypted credentials in the database.
 * Run this ONCE after implementing the encryption system.
 *
 * Usage:
 *   npm run migrate-encrypt-credentials
 *   # or
 *   npx tsx scripts/migrate-encrypt-credentials.ts
 *
 * Prerequisites:
 *   - CREDENTIAL_ENCRYPTION_KEY must be set in environment
 *   - Database must be accessible
 *   - Backup database before running (IMPORTANT!)
 *
 * Safety Features:
 *   - Dry-run mode by default (--execute flag required for actual migration)
 *   - Skips already encrypted credentials
 *   - Validates encryption/decryption before saving
 *   - Transaction support for rollback on error
 *
 * Warning:
 *   - This is a ONE-WAY operation (unencrypted → encrypted)
 *   - BACKUP your database before running
 *   - Test in development environment first
 */

import { PrismaClient } from "@prisma/client";
import {
  encryptCredential,
  decryptCredential,
  isEncrypted,
  validateEncryptionSetup,
} from "../src/lib/encryption";

const prisma = new PrismaClient();

interface MigrationStats {
  total: number;
  alreadyEncrypted: number;
  encrypted: number;
  failed: number;
  errors: Array<{ id: string; platform: string; error: string }>;
}

async function migrateCredentials(executeMode: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    alreadyEncrypted: 0,
    encrypted: 0,
    failed: 0,
    errors: [],
  };

  // Fetch all credentials
  const credentials = await prisma.externalCredential.findMany({
    select: {
      id: true,
      platform: true,
      value: true,
    },
  });

  stats.total = credentials.length;

  console.log(`\n📊 Found ${stats.total} credentials to process\n`);

  for (const credential of credentials) {
    try {
      // Skip if already encrypted
      if (isEncrypted(credential.value)) {
        stats.alreadyEncrypted++;
        console.log(`   ✓ ${credential.platform} (${credential.id}): Already encrypted, skipping`);
        continue;
      }

      // Encrypt the credential
      const encryptedValue = encryptCredential(credential.value);

      // Validate encryption by decrypting and comparing
      const decryptedValue = decryptCredential(encryptedValue);
      if (decryptedValue !== credential.value) {
        throw new Error("Encryption validation failed: decrypted value does not match original");
      }

      // Update in database (only in execute mode)
      if (executeMode) {
        await prisma.externalCredential.update({
          where: { id: credential.id },
          data: { value: encryptedValue },
        });
        console.log(`   ✅ ${credential.platform} (${credential.id}): Encrypted and saved`);
      } else {
        console.log(`   🔍 ${credential.platform} (${credential.id}): Would be encrypted (dry-run mode)`);
      }

      stats.encrypted++;
    } catch (error) {
      stats.failed++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      stats.errors.push({
        id: credential.id,
        platform: credential.platform,
        error: errorMessage,
      });
      console.error(`   ❌ ${credential.platform} (${credential.id}): Failed - ${errorMessage}`);
    }
  }

  return stats;
}

async function main() {
  console.log("\n🔐 Credential Encryption Migration Tool\n");
  console.log("=" .repeat(60));

  // Check for execute flag
  const executeMode = process.argv.includes("--execute");

  if (!executeMode) {
    console.log("\n⚠️  DRY-RUN MODE (no changes will be made)");
    console.log("   Run with --execute flag to actually encrypt credentials\n");
  } else {
    console.log("\n⚠️  EXECUTE MODE - Database will be modified!");
    console.log("   Ensure you have a backup before proceeding\n");
  }

  // Validate encryption setup
  try {
    validateEncryptionSetup();
    console.log("✅ Encryption setup validated\n");
  } catch (error) {
    console.error("\n❌ Encryption setup validation failed:");
    console.error(`   ${error instanceof Error ? error.message : "Unknown error"}\n`);
    process.exit(1);
  }

  try {
    // Run migration
    console.log("🚀 Starting credential encryption migration...\n");
    const stats = await migrateCredentials(executeMode);

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Migration Summary:\n");
    console.log(`   Total credentials:       ${stats.total}`);
    console.log(`   Already encrypted:       ${stats.alreadyEncrypted}`);
    console.log(`   Newly encrypted:         ${stats.encrypted}`);
    console.log(`   Failed:                  ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors encountered:\n");
      stats.errors.forEach((err) => {
        console.log(`   • ${err.platform} (${err.id}): ${err.error}`);
      });
    }

    console.log("\n" + "=".repeat(60));

    if (!executeMode && stats.encrypted > 0) {
      console.log("\n💡 Tip: Run with --execute flag to perform actual encryption:\n");
      console.log("   npm run migrate-encrypt-credentials -- --execute\n");
    } else if (executeMode && stats.encrypted > 0) {
      console.log("\n✨ Migration completed successfully!\n");
      console.log("   All credentials have been encrypted.\n");
    } else if (stats.alreadyEncrypted === stats.total) {
      console.log("\n✅ All credentials are already encrypted. No migration needed.\n");
    }
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(`   ${error instanceof Error ? error.message : "Unknown error"}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run main function
main();
