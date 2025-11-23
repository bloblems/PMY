# Security Design Guidelines

## Overview
PMY handles highly sensitive consent documentation data. Security is our top priority. These guidelines ensure we never experience a Tea App-style data breach where user data is exposed due to authorization failures.

## Security Priorities (Ordered by Criticality)

### 1. User Data Isolation (CRITICAL)
**Priority Level**: P0 - Must never be compromised

**Principle**: Users must ONLY access their own data. Cross-user data access is the most severe security failure.

**Requirements**:
- Every consent record (contract, recording, photo, biometric) MUST be scoped to a `userId`
- All database queries for user data MUST filter by `userId`
- Never implement "get all" endpoints that return data across users
- All creation endpoints MUST set `userId` from the authenticated session (`req.user.id`)

**Code Pattern**:
```typescript
// CORRECT: Scoped to authenticated user
app.post("/api/consent-contracts", isAuthenticated, async (req, res) => {
  const user = req.user as any;
  const contract = await storage.createContract({
    ...data,
    userId: user.id  // REQUIRED
  });
});

// WRONG: Missing userId
app.post("/api/consent-contracts", async (req, res) => {
  const contract = await storage.createContract(data); // DANGER
});
```

### 2. Authentication Enforcement (CRITICAL)
**Priority Level**: P0 - Required for all sensitive endpoints

**Principle**: All endpoints that handle user data require authentication.

**Requirements**:
- All consent data endpoints (GET, POST, DELETE) MUST use `isAuthenticated` middleware
- Unauthenticated requests MUST return 401 Unauthorized
- Never expose consent data through public endpoints
- Session tokens must be secure, HTTP-only, and properly validated

**Protected Endpoints**:
- `/api/recordings` (GET, POST, DELETE)
- `/api/contracts` (GET, POST, DELETE)
- `/api/consent-*` (all consent creation endpoints)

### 3. Ownership Verification (CRITICAL)
**Priority Level**: P0 - Prevent unauthorized access/modification

**Principle**: Users can only read, modify, or delete data they own.

**Requirements**:
- **Database-Level Filtering**: ALL queries MUST filter by BOTH id AND userId in the WHERE clause
- Read operations: Filter by userId in SQL, return undefined if no match
- Delete operations: Filter by userId in SQL, return boolean indicating success
- Update operations: Filter by userId in SQL before updating
- **Defense in Depth**: Filter at DB level (primary) AND validate in code (secondary)
- Never trust client-provided IDs without ownership verification at SQL level

**Code Pattern (Database Storage with Drizzle)**:
```typescript
// CORRECT - Drizzle-based storage filters by BOTH id and userId in SQL
async getContract(id: string, userId: string): Promise<Contract | undefined> {
  const result = await db
    .select()
    .from(consentContracts)
    .where(and(
      eq(consentContracts.id, id),
      eq(consentContracts.userId, userId)  // CRITICAL: Must filter by userId in SQL
    ))
    .limit(1);
  
  const contract = result[0]; // Drizzle returns array
  return contract; // Already filtered by userId at DB level
}

// Delete operation also filters by BOTH id and userId
async deleteContract(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(consentContracts)
    .where(and(
      eq(consentContracts.id, id),
      eq(consentContracts.userId, userId)  // CRITICAL: Must filter by userId
    ))
    .returning();
  return result.length > 0; // Returns true only if owned record was deleted
}
```

**Code Pattern (In-Memory Storage with Map)**:
```typescript
// CORRECT - Map-based storage checks userId before returning
async getContract(id: string, userId: string): Promise<Contract | undefined> {
  const contract = this.contracts.get(id);
  if (!contract || contract.userId !== userId) {
    return undefined; // CRITICAL: Ownership check prevents cross-user access
  }
  return contract;
}

// Delete operation checks userId before deleting
async deleteContract(id: string, userId: string): Promise<boolean> {
  const contract = this.contracts.get(id);
  if (contract && contract.userId === userId) {
    this.contracts.delete(id); // Only delete if user owns it
    return true;
  }
  return false; // Not found or not owned
}
```

**Current Implementation**: We use DbStorage (Drizzle-based with PostgreSQL) in production. MemStorage (Map-based) is provided for testing and development. Both implementations follow the same security principle: **verify ownership before returning or modifying data**.

// Route layer
app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
  const user = req.user as any;
  const deleted = await storage.deleteContract(req.params.id, user.id);
  if (!deleted) {
    return res.status(404).json({ error: "Not found or unauthorized" });
  }
  res.json({ success: true });
});
```

### 4. Session Security and Hardening (HIGH)
**Priority Level**: P1 - Prevent session hijacking and account takeover

**Requirements**:
- Session cookies MUST use `httpOnly: true` (prevent XSS access)
- Session cookies MUST use `secure: true` in production (HTTPS only)
- Session cookies MUST use `sameSite: 'strict'` or `'lax'` (CSRF protection)
- Session secrets MUST be cryptographically random (minimum 32 bytes)
- Implement session rotation on privilege escalation
- Set reasonable session expiration (e.g., 7 days)
- Destroy sessions on logout

**Configuration Pattern**:
```typescript
app.use(session({
  secret: process.env.SESSION_SECRET, // Cryptographically random
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));
```

### 5. Password and Credential Security (HIGH)
**Priority Level**: P1 - Prevent credential compromise

**Requirements**:
- Passwords MUST use PBKDF2 with salt (minimum 100,000 iterations)
- Never log, return, or display passwords or password hashes
- Never include passwords in error messages or stack traces
- Biometric data MUST stay on-device (WebAuthn standard)
- API keys MUST be stored in environment variables, never in code

### 6. Data Encryption (HIGH)
**Priority Level**: P1 - Protect data at rest and in transit

**Requirements**:
- Consent flow state encrypted via Keychain/Keystore on native platforms
- AES-256 encryption for sensitive data at rest
- HTTPS required for all production traffic
- Database credentials stored in environment variables, never in code
- TLS 1.2 or higher for all external API communications

### 7. Logging and Sanitization (MEDIUM)
**Priority Level**: P2 - Prevent credential leaks in logs

**Requirements**:
- NEVER log passwords, session tokens, or API keys
- NEVER log complete user objects (may contain sensitive fields)
- Sanitize error messages before logging (remove sensitive data)
- Log security events: authentication failures, authorization failures, suspicious activity
- Use log levels appropriately (ERROR for failures, WARN for suspicious activity, INFO for normal operations)

**Safe Logging Pattern**:
```typescript
// CORRECT: Log user ID only
console.log(`User ${user.id} created contract ${contract.id}`);

// WRONG: Logs sensitive data
console.log("User data:", user); // May contain password hash, email, etc.
console.log("Session:", req.session); // Contains session token
```

### 8. Input Validation and Size Limits (MEDIUM)
**Priority Level**: P2 - Prevent abuse and DOS

**Requirements**:
- Validate all file uploads (signatures, photos, audio)
- Enforce size limits: Signatures 500KB, Photos 5MB, Audio reasonable duration
- Reject oversized payloads before processing
- Validate data types and formats using Zod schemas

**Current Limits**:
```typescript
const MAX_SIGNATURE_SIZE = 500 * 1024; // 500KB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_DURATION = 300; // 5 minutes (example)
```

### 9. Rate Limiting (MEDIUM)
**Priority Level**: P2 - Prevent abuse, brute force, and DOS

**Requirements**:
- Implement rate limiting on authentication endpoints (login, signup)
- Limit file upload endpoints to prevent storage abuse
- Protect expensive operations (AI policy summarization, payment creation)
- Use progressive delays for repeated failed authentication attempts
- Return 429 Too Many Requests when limits exceeded

**Recommended Limits**:
```typescript
// Authentication endpoints
POST /api/auth/login:     5 requests per minute per IP
POST /api/auth/signup:    3 requests per minute per IP

// File uploads
POST /api/consent-*:      10 uploads per minute per user

// Expensive operations
POST /api/summarize-policy:  5 requests per hour per user
POST /api/verify/*:          10 requests per hour per user
```

### 10. EXIF Metadata Stripping (PLANNED)
**Priority Level**: P2 - Privacy protection

**Future Requirement**:
- Strip EXIF metadata from all uploaded photos
- Remove GPS coordinates, timestamps, device information
- Prevents location tracking and privacy leaks

### 11. Object Storage Security (PLANNED)
**Priority Level**: P2 - Secure file storage

**Future Requirements**:
- Migrate from data URLs to private object storage
- Use signed URLs with expiration for access control
- Implement per-user storage quotas
- Never expose public file URLs

### 12. CSRF Protection (PLANNED)
**Priority Level**: P3 - Prevent cross-site attacks

**Future Requirements**:
- Implement CSRF tokens for state-changing operations
- SameSite cookie attributes (already implemented in session config)
- Validate origin headers for sensitive operations

## Testing Requirements

### Security Test Coverage
Every security-critical feature MUST have automated tests:

**Required Tests**:
1. **Authentication Tests**: Verify 401 for unauthenticated requests
2. **Authorization Tests**: Verify users cannot access other users' data
3. **Deletion Tests**: Verify users cannot delete other users' data
4. **Ownership Tests**: Verify all read operations check ownership

**Test Pattern**:
```typescript
// Create two users
// User 1 creates data
// User 2 attempts to access User 1's data
// Verify: 404 Not Found (not 200 with data)
```

### Security Testing Checklist
Before any release:
- [ ] Run comprehensive authorization tests
- [ ] Verify all consent endpoints require authentication
- [ ] Test cross-user access prevention
- [ ] Verify proper 401/404 responses
- [ ] Check userId is set on all creation operations

## Tea App Breach: Lessons Learned

**What Happened**: In July 2024, Tea App exposed 72,000 images and 1.1M DMs due to:
1. Unsecured Firebase storage bucket (public read access)
2. API vulnerabilities allowing cross-user data access
3. No ownership verification on data operations

**How We Prevent This**:
1. ✅ All storage operations scoped to userId
2. ✅ All endpoints require authentication
3. ✅ Ownership verification on all read/delete operations
4. ✅ Automated security tests prevent regressions
5. 🔄 Planning: Private object storage with signed URLs
6. 🔄 Planning: EXIF metadata stripping

## Secure Development Practices

### When Adding New Endpoints

**Checklist**:
1. Does this handle user data? → Require `isAuthenticated`
2. Does this create user data? → Set `userId` from `req.user.id`
3. Does this read user data? → Filter by `userId` in query
4. Does this modify/delete user data? → Verify ownership first
5. Are errors handled securely? → Return 401/404, never expose internals

### Code Review Requirements

Security-critical changes require review for:
- Authentication middleware present
- userId properly scoped
- Ownership verification implemented
- Proper error responses (401/404)
- No cross-user data leaks

## Incident Response

If a security issue is discovered:
1. **Assess Impact**: What data is exposed? How many users?
2. **Immediate Fix**: Deploy patch as quickly as possible
3. **User Notification**: If data was accessed, notify affected users
4. **Post-Mortem**: Document what happened, how it was fixed, and how to prevent recurrence
5. **Test Enhancement**: Add regression tests to prevent similar issues

## Security Monitoring

### Production Monitoring
- Monitor 401/404 rates for unusual spikes (potential probing)
- Alert on failed authentication attempts
- Track cross-user access attempts (should be zero)
- Log all delete operations with userId for audit trail

### Development Monitoring
- LSP diagnostics for type safety
- Automated security tests in CI/CD
- Regular dependency updates for security patches

## OWASP Top 10 2021 Compliance

**For comprehensive OWASP compliance assessment, see `OWASP_COMPLIANCE.md`.**

PMY achieves **~86% overall OWASP Top 10 (2021) compliance** with strong protections across all critical categories. The complete compliance report includes:
- Detailed scoring for all 10 OWASP categories
- Evidence from 54-endpoint API test battery (Bart) and CORS security tests
- Priority recommendations with effort estimates
- Production readiness certification

---

### Implemented Security Controls (Production-Ready)

The following sections describe specific security controls implemented in PMY. For a full compliance assessment across all OWASP categories, refer to `OWASP_COMPLIANCE.md`.

#### 1. CSRF Protection (A04-Insecure Design)
**Implementation**: Double-submit cookie pattern with SameSite=strict (`server/csrf.ts`)
- Cryptographically secure token generation (32-byte random)
- Token stored in session (server-side) and cookie (client-side)
- Validation middleware on all state-changing operations (POST, PUT, DELETE, PATCH)
- CSRF tokens automatically set on authenticated GET routes
- Frontend automatic token injection in all requests
- CSRF validation failures logged for security monitoring
- **iOS/Capacitor Compatible**: Works in both web and mobile WebView

#### 2. PostgreSQL-Backed Sessions (A02-Cryptographic Failures, A07-Auth Failures)
**Implementation**: Production-ready persistent session storage (`server/auth.ts`)
- PostgreSQL session store using `connect-pg-simple`
- Automatic session table creation (`createTableIfMissing: true`)
- Automatic session pruning every 15 minutes
- Rolling sessions (reset expiration on activity)
- 7-day session expiration with secure, httpOnly, sameSite=strict cookies
- Prevents session fixation and session hijacking attacks
- **Replaces**: In-memory MemoryStore (not production-safe)

#### 3. File Upload Validation (A03-Injection, A04-Insecure Design)
**Implementation**: Server-side file validation with MIME sniffing (`server/fileValidation.ts`)
- MIME type detection using `file-type` library (prevents content smuggling)
- File type allowlists (audio: MP3/M4A/WAV/WebM/OGG/CAF/AAC, photo: JPEG/PNG/WebP)
- iOS-native format support (CAF, AAC, M4A alternative MIME types)
- File size limits (10MB audio, 5MB photos)
- Applied to all file upload endpoints (`/api/consent-recordings`, `/api/consent-photos`)
- Validation outcomes logged for security audit

#### 4. Security Audit Logging (A09-Security Logging Failures)
**Implementation**: Comprehensive structured logging for SIEM integration (`server/securityLogger.ts`)

**Auth Events** (`logAuthEvent`):
- Signup success/failure with email and user ID
- Login success/failure with attempt details
- Logout success/failure tracking
- Password validation failures (without exposing password)

**Consent Operations** (`logConsentEvent`):
- Contract creation (signature/photo/biometric) success/failure
- Recording creation success/failure
- All consent methods tracked with metadata (method, encounter type, document ID)

**File Upload Events** (`logFileUpload`):
- Upload validation success/failure
- Detailed metadata (fileName, fileSize, mimeType, error reasons)
- Tracks both legitimate uploads and rejected malicious files

**Rate Limit Violations** (`logRateLimitViolation`):
- Referral invitation abuse (10/hour limit)
- Document sharing abuse (20/hour limit)
- Suspicious activity tracking

**CSRF Validation Failures** (`logCsrfFailure`):
- High-severity logging for CSRF token validation failures
- Includes request path, method, IP address, user agent
- Helps detect CSRF attack attempts

**Log Format**: Structured JSON with timestamp, event type, user ID, IP address, user agent, status (success/failure/suspicious), severity (low/medium/high/critical)

**Production Integration**: Ready for SIEM systems (Datadog, Splunk, ELK Stack)

#### 5. Rate Limiting (A04-Insecure Design)
**Implementation**: User-scoped rate limiting on email-sending endpoints (`server/routes.ts`)
- 10 referral invitations per hour per user
- 20 document shares per hour per user
- Session-based user identification
- Rate limit violations logged for security monitoring
- Prevents abuse and resource exhaustion

### Future Enhancements

#### Planned Security Improvements
1. **Object Storage Migration**: Replace data URLs with private storage + signed URLs
2. **EXIF Stripping**: Remove metadata from all photos
3. **Envelope Encryption**: AES-256 encryption for consent data at rest
4. **Two-Factor Authentication**: Optional 2FA for enhanced security

#### Long-term Goals
- Security audit by third-party firm
- Penetration testing
- Bug bounty program
- SOC 2 compliance
- GDPR compliance enhancements

## Conclusion

Security is not optional. Every line of code that touches user data must be written with security as the primary consideration. When in doubt, err on the side of caution and require authentication, verify ownership, and limit access.

**Remember**: One security breach can destroy user trust and the entire product. It's always worth the extra effort to get security right.
