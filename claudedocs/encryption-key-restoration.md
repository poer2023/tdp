# Encryption Key Restoration - 2025-11-02

## Issue

Credential decryption was failing with error: "Unsupported state or unable to authenticate data"

## Root Cause

The encryption key in `.env` file was changed at some point, but the credentials in the database were encrypted with the old key.

## Timeline

- Database credentials encrypted with key: `df0df9fdeb50f619fc9846335b31acea8a7230d5aff554d0a30f4e97b7042daf`
- `.env` file had a different key: `75796ef9b192c68c1ea69632776a008c8e861da9ce49cedc6a7a1782f61e9e8e`
- Likely caused by accidental key regeneration without credential migration

## Resolution

Restored the original encryption key in `.env` file (line 8):

```
CREDENTIAL_ENCRYPTION_KEY="df0df9fdeb50f619fc9846335b31acea8a7230d5aff554d0a30f4e97b7042daf"
```

## Verification

- Created test script to verify decryption with actual database values
- Successfully decrypted Bilibili credential (274 characters)
- Confirmed credentials page loads correctly in development server (200 status)

## Best Practices for Future

1. **Never rotate encryption keys without a migration plan**
2. **Document key changes in version control**
3. **Add startup validation** to detect key mismatches early:
   - Test decryption of a sample credential on app startup
   - Log clear error if key mismatch detected
4. **Implement proper key rotation**:
   - Decrypt all credentials with old key
   - Re-encrypt with new key
   - Update .env file
   - Verify all credentials can be decrypted

## Affected Systems

- External credentials (GitHub, Douban, Bilibili, Steam)
- Admin credentials management page
- Media sync operations requiring credential access
