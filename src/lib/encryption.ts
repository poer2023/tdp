/**
 * Credential Encryption Utilities
 * Provides AES-256-GCM encryption for sensitive credential data
 *
 * Security Requirements:
 * - AES-256-GCM encryption algorithm
 * - Unique initialization vector (IV) for each encryption
 * - Authentication tag for integrity verification
 * - Base64 encoding for database storage
 *
 * Environment Requirements:
 * - CREDENTIAL_ENCRYPTION_KEY: 32-byte hex string (64 characters)
 *   Generate with: node scripts/generate-encryption-key.ts
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable
 * @throws Error if encryption key is not configured or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is not set. " +
        "Generate a key using: node scripts/generate-encryption-key.ts"
    );
  }

  // Validate key format (64 hex characters = 32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes). " +
        "Generate a valid key using: node scripts/generate-encryption-key.ts"
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt sensitive credential data
 *
 * @param plaintext - The sensitive data to encrypt (e.g., API key, password)
 * @returns Base64-encoded encrypted data with format: iv:authTag:ciphertext
 *
 * @example
 * const encrypted = encryptCredential("my-secret-api-key");
 * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext || plaintext.trim().length === 0) {
    throw new Error("Cannot encrypt empty credential data");
  }

  const key = getEncryptionKey();

  // Generate random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  // Get authentication tag for integrity verification
  const authTag = cipher.getAuthTag();

  // Combine iv:authTag:ciphertext for storage
  const encrypted = `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext}`;

  return encrypted;
}

/**
 * Decrypt encrypted credential data
 *
 * @param encryptedData - Base64-encoded encrypted data with format: iv:authTag:ciphertext
 * @returns Decrypted plaintext credential data
 * @throws Error if decryption fails (wrong key, tampered data, corrupted format)
 *
 * @example
 * const decrypted = decryptCredential("a1b2c3d4....:e5f6g7h8....:i9j0k1l2....");
 * // Returns: "my-secret-api-key"
 */
export function decryptCredential(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim().length === 0) {
    throw new Error("Cannot decrypt empty encrypted data");
  }

  // Parse encrypted data format: iv:authTag:ciphertext
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted data format. Expected format: iv:authTag:ciphertext"
    );
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let plaintext = decipher.update(ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");

    return plaintext;
  } catch (error) {
    // Decryption failure could mean:
    // 1. Wrong encryption key
    // 2. Tampered data (auth tag verification failed)
    // 3. Corrupted encrypted data
    throw new Error(
      `Credential decryption failed: ${error instanceof Error ? error.message : "Unknown error"}. ` +
        "This could indicate wrong encryption key, tampered data, or corrupted storage."
    );
  }
}

/**
 * Check if credential data is already encrypted
 *
 * @param data - Credential data to check
 * @returns true if data appears to be encrypted, false otherwise
 *
 * @example
 * isEncrypted("plain-text-password") // false
 * isEncrypted("a1b2c3d4....:e5f6g7h8....:i9j0k1l2....") // true
 */
export function isEncrypted(data: string): boolean {
  if (!data || data.trim().length === 0) {
    return false;
  }

  // Check for our encrypted format: iv:authTag:ciphertext
  const parts = data.split(":");
  if (parts.length !== 3) {
    return false;
  }

  // Validate Base64 format for all parts
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return parts.every((part) => base64Regex.test(part));
}

/**
 * Safely encrypt credential data (idempotent operation)
 * If data is already encrypted, returns it unchanged
 *
 * @param data - Credential data to encrypt
 * @returns Encrypted credential data
 *
 * @example
 * const encrypted1 = safeEncrypt("password");
 * const encrypted2 = safeEncrypt(encrypted1); // Returns encrypted1 unchanged
 */
export function safeEncrypt(data: string): string {
  if (isEncrypted(data)) {
    return data;
  }
  return encryptCredential(data);
}

/**
 * Validate encryption key configuration
 * Use this during application startup to ensure encryption is properly configured
 *
 * @throws Error if encryption key is not configured or invalid
 *
 * @example
 * // In your application startup:
 * validateEncryptionSetup();
 */
export function validateEncryptionSetup(): void {
  try {
    getEncryptionKey();
  } catch (error) {
    throw new Error(
      `Encryption setup validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
