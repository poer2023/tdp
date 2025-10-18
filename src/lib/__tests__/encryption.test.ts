import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import {
  encryptCredential,
  decryptCredential,
  isEncrypted,
  safeEncrypt,
  validateEncryptionSetup,
} from "../encryption";

// Mock environment variable for testing
const TEST_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");

describe("Encryption Library", () => {
  beforeEach(() => {
    // Set test encryption key in environment
    vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
  });

  describe("encryptCredential", () => {
    it("should encrypt plaintext successfully", () => {
      const plaintext = "sensitive_credential_data";
      const encrypted = encryptCredential(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:ciphertext format
    });

    it("should produce different ciphertexts for same plaintext (IV uniqueness)", () => {
      const plaintext = "same_credential";
      const encrypted1 = encryptCredential(plaintext);
      const encrypted2 = encryptCredential(plaintext);

      expect(encrypted1).not.toBe(encrypted2); // Different due to unique IVs
      expect(decryptCredential(encrypted1)).toBe(plaintext);
      expect(decryptCredential(encrypted2)).toBe(plaintext);
    });

    it("should throw error for empty string", () => {
      expect(() => encryptCredential("")).toThrow(
        "Cannot encrypt empty credential data"
      );
    });

    it("should handle special characters and Unicode", () => {
      const specialText = "测试数据 @#$%^&*() 🔒";
      const encrypted = encryptCredential(specialText);
      expect(decryptCredential(encrypted)).toBe(specialText);
    });

    it("should handle long credentials", () => {
      const longText = "x".repeat(10000);
      const encrypted = encryptCredential(longText);
      expect(decryptCredential(encrypted)).toBe(longText);
    });

    it("should throw error if encryption key is missing", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "");
      expect(() => encryptCredential("data")).toThrow();
    });

    it("should throw error if encryption key has invalid format", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "invalid_key");
      expect(() => encryptCredential("data")).toThrow();
    });
  });

  describe("decryptCredential", () => {
    it("should decrypt encrypted data correctly", () => {
      const original = "my_secret_password";
      const encrypted = encryptCredential(original);
      const decrypted = decryptCredential(encrypted);

      expect(decrypted).toBe(original);
    });

    it("should throw error for invalid encrypted data format", () => {
      expect(() => decryptCredential("invalid:format")).toThrow();
      expect(() => decryptCredential("only_one_part")).toThrow();
      expect(() => decryptCredential("")).toThrow();
    });

    it("should throw error for tampered ciphertext", () => {
      const encrypted = encryptCredential("original_data");
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Tamper with ciphertext
      const tamperedCiphertext = ciphertext.slice(0, -4) + "AAAA";
      const tampered = `${iv}:${authTag}:${tamperedCiphertext}`;

      expect(() => decryptCredential(tampered)).toThrow();
    });

    it("should throw error for tampered authentication tag", () => {
      const encrypted = encryptCredential("original_data");
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Tamper with auth tag
      const tamperedAuthTag = authTag.slice(0, -4) + "BBBB";
      const tampered = `${iv}:${tamperedAuthTag}:${ciphertext}`;

      expect(() => decryptCredential(tampered)).toThrow();
    });

    it("should throw error for tampered IV", () => {
      const encrypted = encryptCredential("original_data");
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Tamper with IV
      const tamperedIV = iv.slice(0, -4) + "CCCC";
      const tampered = `${tamperedIV}:${authTag}:${ciphertext}`;

      expect(() => decryptCredential(tampered)).toThrow();
    });

    it("should throw error if encryption key is missing", () => {
      const encrypted = encryptCredential("data");
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "");
      expect(() => decryptCredential(encrypted)).toThrow();
    });

    it("should throw error if wrong encryption key is used", () => {
      const encrypted = encryptCredential("data");
      const wrongKey = crypto.randomBytes(32).toString("hex");
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", wrongKey);
      expect(() => decryptCredential(encrypted)).toThrow();
    });
  });

  describe("isEncrypted", () => {
    it("should return true for valid encrypted data", () => {
      const encrypted = encryptCredential("test_data");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plaintext data", () => {
      expect(isEncrypted("plain_text_credential")).toBe(false);
      expect(isEncrypted("SESSDATA=abc123")).toBe(false);
      expect(isEncrypted("cookie_value")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isEncrypted("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(isEncrypted("   ")).toBe(false);
      expect(isEncrypted("\n\t")).toBe(false);
    });

    it("should return false for invalid format (wrong number of parts)", () => {
      expect(isEncrypted("only_one_part")).toBe(false);
      expect(isEncrypted("two:parts")).toBe(false);
      expect(isEncrypted("four:parts:are:here")).toBe(false);
    });

    it("should return false for valid format but invalid base64", () => {
      expect(isEncrypted("invalid@base64:another@invalid:third@invalid")).toBe(
        false
      );
    });

    it("should return true for correctly formatted base64 (even if not from our encryption)", () => {
      const validBase64 = `${Buffer.from("test1").toString(
        "base64"
      )}:${Buffer.from("test2").toString("base64")}:${Buffer.from(
        "test3"
      ).toString("base64")}`;
      expect(isEncrypted(validBase64)).toBe(true);
    });
  });

  describe("safeEncrypt", () => {
    it("should encrypt plaintext data", () => {
      const plaintext = "unencrypted_credential";
      const result = safeEncrypt(plaintext);

      expect(result).not.toBe(plaintext);
      expect(isEncrypted(result)).toBe(true);
      expect(decryptCredential(result)).toBe(plaintext);
    });

    it("should return already encrypted data unchanged", () => {
      const plaintext = "test_data";
      const encrypted = encryptCredential(plaintext);
      const result = safeEncrypt(encrypted);

      expect(result).toBe(encrypted); // Should be unchanged
      expect(decryptCredential(result)).toBe(plaintext);
    });

    it("should be idempotent (multiple calls return same result)", () => {
      const encrypted = encryptCredential("credential");
      const result1 = safeEncrypt(encrypted);
      const result2 = safeEncrypt(result1);
      const result3 = safeEncrypt(result2);

      expect(result1).toBe(encrypted);
      expect(result2).toBe(encrypted);
      expect(result3).toBe(encrypted);
    });

    it("should throw error for empty string", () => {
      expect(() => safeEncrypt("")).toThrow(
        "Cannot encrypt empty credential data"
      );
    });

    it("should encrypt special characters correctly", () => {
      const specialText = "测试 @#$% 🔐";
      const result = safeEncrypt(specialText);
      expect(isEncrypted(result)).toBe(true);
      expect(decryptCredential(result)).toBe(specialText);
    });
  });

  describe("validateEncryptionSetup", () => {
    it("should pass validation with valid encryption key", () => {
      expect(() => validateEncryptionSetup()).not.toThrow();
    });

    it("should throw error if encryption key is missing", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "");
      expect(() => validateEncryptionSetup()).toThrow(
        /CREDENTIAL_ENCRYPTION_KEY environment variable is not set/
      );
    });

    it("should throw error if encryption key is not 64 hex characters", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "too_short");
      expect(() => validateEncryptionSetup()).toThrow(
        /CREDENTIAL_ENCRYPTION_KEY must be a 64-character hexadecimal string/
      );
    });

    it("should throw error if encryption key has invalid characters", () => {
      vi.stubEnv(
        "CREDENTIAL_ENCRYPTION_KEY",
        "g".repeat(64) // 'g' is not a valid hex character
      );
      expect(() => validateEncryptionSetup()).toThrow(
        /CREDENTIAL_ENCRYPTION_KEY must be a 64-character hexadecimal string/
      );
    });

    it("should throw error if encryption key is exactly 32 bytes but wrong format", () => {
      const invalidKey = "A".repeat(63) + "Z"; // 64 chars but includes 'Z' which is valid hex, but let's test with non-hex
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "X".repeat(64)); // X is not hex
      expect(() => validateEncryptionSetup()).toThrow();
    });
  });

  describe("End-to-End Encryption Flow", () => {
    it("should encrypt and decrypt multiple credentials independently", () => {
      const credentials = [
        "bilibili_cookie_1",
        "douban_cookie_2",
        "steam_api_key_3",
      ];

      const encrypted = credentials.map((c) => encryptCredential(c));
      const decrypted = encrypted.map((e) => decryptCredential(e));

      expect(decrypted).toEqual(credentials);
      expect(encrypted[0]).not.toBe(encrypted[1]); // Different credentials → different ciphertexts
    });

    it("should maintain data integrity through multiple encrypt/decrypt cycles", () => {
      const original = "critical_credential_data";

      // Cycle 1
      const enc1 = encryptCredential(original);
      const dec1 = decryptCredential(enc1);
      expect(dec1).toBe(original);

      // Cycle 2 - re-encrypt decrypted data
      const enc2 = encryptCredential(dec1);
      const dec2 = decryptCredential(enc2);
      expect(dec2).toBe(original);

      // Cycle 3
      const enc3 = encryptCredential(dec2);
      const dec3 = decryptCredential(enc3);
      expect(dec3).toBe(original);
    });

    it("should handle backward compatibility scenario (mixed encrypted/plaintext)", () => {
      const plainCredential = "old_unencrypted_data";
      const encryptedCredential = encryptCredential("new_encrypted_data");

      // Simulating service checking if encryption is needed
      const processedPlain = isEncrypted(plainCredential)
        ? decryptCredential(plainCredential)
        : plainCredential;

      const processedEncrypted = isEncrypted(encryptedCredential)
        ? decryptCredential(encryptedCredential)
        : encryptedCredential;

      expect(processedPlain).toBe("old_unencrypted_data");
      expect(processedEncrypted).toBe("new_encrypted_data");
    });
  });

  describe("Security Properties", () => {
    it("should use authenticated encryption (GCM mode)", () => {
      const encrypted = encryptCredential("test");
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Auth tag should be present and valid base64
      expect(authTag).toBeDefined();
      expect(authTag.length).toBeGreaterThan(0);
      expect(() => Buffer.from(authTag, "base64")).not.toThrow();
    });

    it("should use unique IV for each encryption", () => {
      const ivSet = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptCredential("same_data");
        const [iv] = encrypted.split(":");
        ivSet.add(iv);
      }

      // All IVs should be unique
      expect(ivSet.size).toBe(100);
    });

    it("should use 128-bit (16 byte) IV", () => {
      const encrypted = encryptCredential("test");
      const [ivBase64] = encrypted.split(":");
      const ivBuffer = Buffer.from(ivBase64, "base64");

      expect(ivBuffer.length).toBe(16); // 128 bits = 16 bytes
    });

    it("should use 128-bit (16 byte) authentication tag", () => {
      const encrypted = encryptCredential("test");
      const [, authTagBase64] = encrypted.split(":");
      const authTagBuffer = Buffer.from(authTagBase64, "base64");

      expect(authTagBuffer.length).toBe(16); // 128 bits = 16 bytes
    });

    it("should detect tampering via authentication tag", () => {
      const encrypted = encryptCredential("important_data");
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Modify a single bit in ciphertext
      const ciphertextBuffer = Buffer.from(ciphertext, "base64");
      ciphertextBuffer[0] = ciphertextBuffer[0] ^ 0x01; // Flip one bit
      const tamperedCiphertext = ciphertextBuffer.toString("base64");

      const tampered = `${iv}:${authTag}:${tamperedCiphertext}`;

      // Decryption should fail due to auth tag mismatch
      expect(() => decryptCredential(tampered)).toThrow();
    });
  });
});
