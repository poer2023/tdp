#!/usr/bin/env node
/**
 * Generate Encryption Key for Credential Management
 *
 * This script generates a cryptographically secure 32-byte (256-bit) encryption key
 * for use with AES-256-GCM encryption of sensitive credential data.
 *
 * Usage:
 *   npm run generate-key
 *   # or
 *   npx ts-node scripts/generate-encryption-key.ts
 *
 * Output:
 *   - Displays generated key in terminal
 *   - Provides instructions for adding to .env.local
 *
 * Security Notes:
 *   - Generated key is 32 bytes (256 bits) of cryptographically secure random data
 *   - Key is displayed as 64-character hexadecimal string
 *   - Store securely in .env.local (NEVER commit to version control)
 *   - Key rotation requires re-encryption of all existing credentials
 */

import crypto from "crypto";

function generateEncryptionKey(): string {
  // Generate 32 bytes (256 bits) of cryptographically secure random data
  const keyBuffer = crypto.randomBytes(32);

  // Convert to hexadecimal string (64 characters)
  const keyHex = keyBuffer.toString("hex");

  return keyHex;
}

function main() {
  console.log("\n🔐 Credential Encryption Key Generator\n");
  console.log("=" .repeat(60));

  // Generate encryption key
  const encryptionKey = generateEncryptionKey();

  console.log("\n✅ Generated new AES-256-GCM encryption key:\n");
  console.log(`   ${encryptionKey}\n`);
  console.log("=" .repeat(60));

  console.log("\n📝 Setup Instructions:\n");
  console.log("1. Add this line to your .env.local file:");
  console.log(`   CREDENTIAL_ENCRYPTION_KEY=${encryptionKey}\n`);

  console.log("2. Ensure .env.local is in your .gitignore (NEVER commit encryption keys!)");
  console.log("3. For production deployment, add this environment variable to your hosting platform\n");

  console.log("⚠️  IMPORTANT SECURITY NOTES:\n");
  console.log("   • Keep this key SECRET and SECURE");
  console.log("   • NEVER commit encryption keys to version control");
  console.log("   • Store backup of this key in a secure password manager");
  console.log("   • Losing this key means PERMANENT LOSS of encrypted credential data");
  console.log("   • Key rotation requires re-encryption of all existing credentials\n");

  console.log("=" .repeat(60));
  console.log("\n✨ Key generation complete!\n");
}

// Run main function
main();
