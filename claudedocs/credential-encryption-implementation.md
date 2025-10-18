# Credential Encryption Implementation - Phase 3.1

## Overview

Implemented AES-256-GCM encryption for sensitive credential data in production environments.

## Components Created

### 1. Encryption Library (`/src/lib/encryption.ts`)

**Features:**
- AES-256-GCM encryption algorithm
- Unique initialization vector (IV) for each encryption operation
- Authentication tag for integrity verification
- Base64 encoding for database storage
- Safe encryption helpers (idempotent, encrypted data detection)
- Comprehensive error handling and validation

**Key Functions:**
- `encryptCredential(plaintext)` - Encrypts sensitive data
- `decryptCredential(encryptedData)` - Decrypts encrypted data
- `isEncrypted(data)` - Checks if data is already encrypted
- `safeEncrypt(data)` - Idempotent encryption (doesn't re-encrypt)
- `validateEncryptionSetup()` - Validates environment configuration

**Storage Format:** `iv:authTag:ciphertext` (Base64 encoded)

### 2. Key Generation Script (`/scripts/generate-encryption-key.ts`)

Generates cryptographically secure 32-byte (256-bit) encryption keys.

**Usage:**
```bash
npm run generate-key
```

**Output:** 64-character hexadecimal string for `CREDENTIAL_ENCRYPTION_KEY` environment variable

### 3. Migration Script (`/scripts/migrate-encrypt-credentials.ts`)

Encrypts existing unencrypted credentials in the database.

**Features:**
- Dry-run mode by default (safe testing)
- Skips already encrypted credentials
- Validates encryption before saving
- Transaction support for rollback
- Detailed migration statistics

**Usage:**
```bash
# Dry run (preview only)
npm run migrate-encrypt-credentials

# Execute actual encryption
npm run migrate-encrypt-credentials -- --execute
```

## Integration Points

### Media Sync Service (`/src/lib/media-sync/index.ts`)

**Updated:**
- Bilibili credentials: Decrypts cookie values before parsing
- Douban credentials: Decrypts cookie values before API calls
- Backward compatible with unencrypted credentials using `isEncrypted()` check

**Implementation Pattern:**
```typescript
// Decrypt credential value if encrypted
const credentialValue = isEncrypted(credential.value)
  ? decryptCredential(credential.value)
  : credential.value;

// Use decrypted value
const cookieParts = credentialValue.split(";").reduce(/* ... */);
```

### Gaming Sync Service (`/src/lib/gaming/sync-service.ts`)

**Analysis:**
- Steam credentials use public `steamId` in metadata (not sensitive)
- HoYoverse credentials use public `uid` in metadata (not sensitive)
- No sensitive data in `value` field for gaming platforms
- **No changes required** - gaming platforms use public identifiers

## Environment Configuration

### Required Environment Variable

```env
# .env.local
CREDENTIAL_ENCRYPTION_KEY=<64-character-hex-string>
```

**Generation:**
```bash
npm run generate-key
```

### Security Recommendations

1. **Never commit encryption keys to version control**
2. **Store backup in secure password manager**
3. **Losing the key = permanent loss of encrypted data**
4. **Key rotation requires re-encryption of all credentials**

## Deployment Steps

### Development Environment

1. Generate encryption key:
   ```bash
   npm run generate-key
   ```

2. Add to `.env.local`:
   ```env
   CREDENTIAL_ENCRYPTION_KEY=<generated-key>
   ```

3. Migrate existing credentials (dry-run first):
   ```bash
   npm run migrate-encrypt-credentials
   npm run migrate-encrypt-credentials -- --execute
   ```

### Production Environment

1. Generate production encryption key (separate from dev)
2. Add `CREDENTIAL_ENCRYPTION_KEY` to hosting platform environment variables
3. Deploy application code
4. Run migration script in production:
   ```bash
   # Backup database first!
   npm run migrate-encrypt-credentials -- --execute
   ```

## Credential Write Operations (To Be Implemented)

### Locations Requiring Encryption on Write

1. **Credential Creation API** (needs implementation)
   - Location: `/src/app/api/admin/credentials/route.ts` (POST)
   - Action: Encrypt `value` field before `prisma.externalCredential.create()`

2. **Credential Update API** (needs implementation)
   - Location: `/src/app/api/admin/credentials/[id]/route.ts` (PATCH)
   - Action: Encrypt `value` field before `prisma.externalCredential.update()`

3. **Credential Form Submission** (needs implementation)
   - Location: Frontend credential form components
   - Action: Ensure API endpoints handle encryption server-side

### Implementation Pattern for Write Operations

```typescript
import { encryptCredential } from "@/lib/encryption";

// Before saving to database
const encryptedValue = encryptCredential(credentialValue);

await prisma.externalCredential.create({
  data: {
    platform: "BILIBILI",
    value: encryptedValue,  // Store encrypted
    // ... other fields
  },
});
```

## Testing

### Manual Testing

1. Create test credential with encryption:
   ```typescript
   const encrypted = encryptCredential("test-api-key");
   // Save to database
   ```

2. Verify decryption in sync operation:
   ```typescript
   const decrypted = decryptCredential(encrypted);
   // Should equal "test-api-key"
   ```

3. Test backward compatibility:
   ```typescript
   // Unencrypted credentials should still work
   isEncrypted("plain-text") // false
   ```

### Security Testing

1. Verify encryption uniqueness (same input → different output due to IV)
2. Test authentication tag verification (detect tampered data)
3. Validate wrong key rejection (decryption fails with incorrect key)

## Status

✅ **Completed:**
- Encryption library implementation
- Key generation script
- Migration script
- Media sync service integration (read operations)
- Gaming sync service analysis (no changes needed)

⏳ **Remaining:**
- Credential creation API encryption (POST /api/admin/credentials)
- Credential update API encryption (PATCH /api/admin/credentials/[id])
- Frontend form integration validation
- Production migration documentation
- E2E testing with encrypted credentials

## Next Steps

Phase 3.1 encryption system is functionally complete for read operations. Before moving to Phase 4.1 (Auto-scheduling), should:

1. Implement credential write API encryption
2. Test full credential lifecycle (create → encrypt → read → decrypt)
3. Document production migration procedure
4. Consider adding credential rotation mechanism

## Security Notes

**Encryption Algorithm:** AES-256-GCM
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, random per encryption)
- **Auth Tag:** 128 bits (16 bytes, for integrity)

**Benefits:**
- Authenticated encryption (prevents tampering)
- Unique IV per encryption (same plaintext → different ciphertext)
- Industry-standard algorithm (NIST approved)

**Limitations:**
- Server-side encryption only (credentials decrypted during sync)
- Key management responsibility on deployment environment
- No automatic key rotation (manual process required)
