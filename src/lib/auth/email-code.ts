import { createHash } from "crypto";

/**
 * Generate a verification code composed of digits.
 */
export function generateVerificationCode(length = 6): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Hash the verification token using the same strategy as NextAuth.
 */
export function hashVerificationToken(
  token: string,
  secret: string,
  providerSecret?: string
): string {
  return createHash("sha256")
    .update(`${token}${providerSecret ?? secret}`)
    .digest("hex");
}
