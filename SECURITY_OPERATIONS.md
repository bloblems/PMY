# PMY Security Operations Guide

## Related Documentation

- **`OWASP_COMPLIANCE.md`** - Comprehensive OWASP Top 10 compliance assessment (~86% compliance)
- **`SECURITY_GUIDELINES.md`** - Developer security implementation patterns
- **`bart.ts`** - Run comprehensive 54-endpoint security test battery
- **`test-cors.ts`** - Validate CORS configuration

---

## Production Deployment Checklist

### CORS Configuration

Before deploying PMY to production, you **must** configure allowed origins to prevent unauthorized access.

#### Setting Production Origins

Set the `ALLOWED_ORIGINS` environment variable with a comma-separated list of allowed domains:

```bash
# Example for Replit deployment
ALLOWED_ORIGINS="https://pmy.replit.app,https://www.pmy.app,https://pmy.app"
```

#### How It Works

1. **Development Mode**: Automatically allows all `localhost` and `127.0.0.1` origins
2. **Production Mode**: Only allows explicitly whitelisted origins from `ALLOWED_ORIGINS`
3. **Mobile/Native Apps**: Requests with no origin are allowed (native apps, Postman, curl)

#### Testing CORS Configuration

```bash
# Test from allowed origin (should work)
curl -H "Origin: https://pmy.replit.app" https://your-backend.com/api/universities

# Test from disallowed origin (should fail with 403)
curl -H "Origin: https://evil-site.com" https://your-backend.com/api/universities
```

#### Monitoring Rejected Origins

Watch server logs for rejected CORS attempts:

```
CORS: Rejected origin: https://unauthorized-domain.com
CORS rejection: https://unauthorized-domain.com attempted to access /api/contracts
```

If you see legitimate origins being rejected, add them to `ALLOWED_ORIGINS`.

---

## Rate Limiting Configuration

PMY implements tiered rate limiting to prevent abuse while allowing normal usage.

### Rate Limit Tiers

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|---------|---------|
| **Auth Operations** | 5 requests | 15 minutes | Prevent brute force attacks |
| **File Uploads** | 10 requests | 1 hour | Prevent storage abuse |
| **State Changes** | 30 requests | 15 minutes | Prevent spam (amendments, notifications) |
| **Email Operations** | 3 requests | 1 hour | Prevent email spam |
| **General API** | 100 requests | 15 minutes | General abuse protection |

### Protected Endpoints

#### Auth Operations (5 req/15min)
- `PATCH /api/auth/change-email`
- `DELETE /api/auth/delete-all-data`
- `DELETE /api/auth/delete-account`

#### File Uploads (10 req/hour)
- `POST /api/recordings` (audio/video uploads)

#### State Changes (30 req/15min)
- `PATCH /api/auth/retention-policy`
- `POST /api/amendments/contract/:contractId`
- `POST /api/amendments/:id/approve`
- `POST /api/amendments/:id/reject`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/recordings/:id`

### Rate Limit Headers

Clients receive standard rate limit headers:

```
RateLimit-Limit: 30
RateLimit-Remaining: 27
RateLimit-Reset: 1640995200
```

### Handling Rate Limit Errors

When rate limited, clients receive:

```json
{
  "error": "Too many requests. Please slow down and try again in 15 minutes."
}
```

HTTP Status: `429 Too Many Requests`

### Adjusting Rate Limits

Edit `server/middleware/rateLimiting.ts` to adjust limits:

```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Increase this for higher limits
  // ...
});
```

**Note**: Higher limits reduce security. Only increase if justified by legitimate usage patterns.

---

## Security Monitoring

### Key Metrics to Monitor

1. **Failed Auth Attempts**: High rate may indicate brute force attack
2. **Rate Limit Violations**: Repeated 429 errors from same IP
3. **CORS Rejections**: Unauthorized domains attempting access
4. **File Upload Patterns**: Unusual upload volumes or sizes

### Setting Up Alerts

Configure alerts for:
- More than 10 failed auth attempts from single IP in 1 hour
- More than 50 CORS rejections per hour
- File uploads exceeding 100MB total in 1 hour
- More than 100 rate limit violations from single IP

---

## Incident Response

### Suspected Brute Force Attack

1. Review server logs for pattern of failed auth attempts
2. Identify attacking IP addresses
3. Consider reducing `authRateLimiter` max from 5 to 3
4. Add IP to blocklist if persistent

### CORS Bypass Attempts

1. Monitor logs for rejected origins
2. Verify `ALLOWED_ORIGINS` environment variable is set
3. Ensure origins are exactly matched (trailing slash matters)
4. Check for typos in production domain configuration

### Storage Abuse (File Upload Spam)

1. Review `uploadRateLimiter` violations in logs
2. Check uploaded file sizes and types
3. Verify file validation is working
4. Consider reducing limit from 10/hour to 5/hour

---

## Pre-Launch Security Checklist

- [ ] Set `ALLOWED_ORIGINS` environment variable with production domains
- [ ] Test CORS from production domain (should allow)
- [ ] Test CORS from unauthorized domain (should reject with 403)
- [ ] Verify rate limiting on auth endpoints (max 5 req/15min)
- [ ] Verify rate limiting on file uploads (max 10 req/hour)
- [ ] Review server logs to confirm CORS and rate limit logging
- [ ] Set up monitoring alerts for security events
- [ ] Document production domain list for ops team
- [ ] Test mobile app can connect (no origin = allowed)
- [ ] Verify all 54 API endpoints still functional (run `npx tsx bart.ts`)

---

## Production Environment Variables

Required security-related environment variables for production:

```bash
# CORS Configuration
ALLOWED_ORIGINS="https://pmy.replit.app,https://www.pmy.app"

# Database
DATABASE_URL="postgresql://..."

# Authentication
SESSION_SECRET="..." # Secure random string (32+ chars)

# Stripe (for verification features)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# Email
RESEND_API_KEY="re_..."

# Supabase (for auth)
SUPABASE_PROJECT_URL="https://..."
SUPABASE_ANON_PUBLIC="..."
SUPABASE_SERVICE_ROLE_SECRET="..."
```

**Security Note**: Never commit these values to git. Use environment variable management in your deployment platform.

---

## Testing Security Configuration

Run Bart's comprehensive test battery to verify security doesn't break functionality:

```bash
npx tsx bart.ts
```

Expected: **54/54 tests passing (100%)**

If any tests fail after security changes, review logs and investigate.
