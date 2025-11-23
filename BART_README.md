# 🤖 Bart - The PMY Testing Agent

Bart is PMY's custom AI-powered testing agent that performs comprehensive API endpoint verification without the limitations of traditional e2e testing frameworks.

## Why Bart?

The built-in Replit testing agent has a **hard requirement for Stripe credentials** even when Stripe isn't needed for testing. Bart bypasses this entirely while providing:

- ✅ **No Stripe blocker** - Tests run without payment service credentials
- ✅ **No browser automation** - Lightweight API testing without Playwright setup
- ✅ **AI-powered analysis** - OpenAI analyzes failures and suggests fixes
- ✅ **Comprehensive coverage** - Tests 51+ endpoints across 8 domain routers
- ✅ **Works in Replit** - No special setup or system dependencies needed

## Quick Start

```bash
# Run all tests
npx tsx bart.ts

# The test will automatically:
# 1. Verify app health
# 2. Test all 23 contracts router endpoints
# 3. Test all 28 other domain router endpoints
# 4. Analyze failures with AI (if OpenAI key is set)
# 5. Generate a comprehensive report
```

## What Bart Tests

### 🏥 App Health (2 tests)
- Server is running and responding
- Stripe is properly disabled for testing

### 🔧 Contracts Router (23 endpoints)
**Basic CRUD:**
- `GET /api/contracts` - List user's contracts
- `GET /api/contracts/:id` - Get single contract
- `POST /api/contracts` - Create new contract
- `DELETE /api/contracts/:id` - Delete contract
- `POST /api/contracts/:id/pause` - Pause active contract
- `POST /api/contracts/:id/resume` - Resume paused contract

**Consent Creation:**
- `POST /api/consent-contracts` - Create signed contract
- `POST /api/consent-recordings` - Create audio consent
- `POST /api/consent-photos` - Create photo consent
- `POST /api/consent-biometric` - Create biometric consent

**Collaborative Contracts:**
- `GET /api/contracts/drafts` - Get user's drafts
- `POST /api/contracts/draft` - Save new draft
- `PATCH /api/contracts/draft/:id` - Update draft
- `GET /api/contracts/shared` - Get contracts shared with user
- `POST /api/contracts/:id/share` - Share contract
- `GET /api/contracts/invitations` - Get pending invitations
- `GET /api/contracts/invitations/pmy` - Get PMY user invitations
- `GET /api/contracts/invitations/:code` - Get invitation details
- `POST /api/contracts/invitations/:code/accept` - Accept invitation
- `POST /api/contracts/:id/approve` - Approve collaborative contract
- `POST /api/contracts/:id/reject` - Reject collaborative contract
- `POST /api/contracts/:id/confirm-consent` - Confirm consent for contract

**AI Services:**
- `POST /api/consent/interpret-custom-text` - Interpret custom consent terms

### 🌐 Other Domain Routers (28 endpoints)

**Universities Router (2 endpoints):**
- `GET /api/universities` - List all universities
- `GET /api/universities/:id` - Get university details

**State Laws Router (2 endpoints):**
- `GET /api/state-laws` - List all state consent laws
- `GET /api/state-laws/:code` - Get state laws by code

**Notifications Router (4 endpoints):**
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

**Recordings Router (3 endpoints):**
- `GET /api/recordings` - List user's recordings
- `GET /api/recordings/:id` - Get recording details
- `DELETE /api/recordings/:id` - Delete recording

**Amendments Router (4 endpoints):**
- `POST /api/amendments` - Create amendment request
- `GET /api/amendments/contract/:contractId` - Get contract amendments
- `POST /api/amendments/:id/approve` - Approve amendment
- `POST /api/amendments/:id/reject` - Reject amendment

**Auth Router (6 endpoints):**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user
- `POST /api/auth/webauthn/challenge` - Get WebAuthn challenge
- `POST /api/auth/webauthn/verify` - Verify WebAuthn response

**Profile Router (8 endpoints):**
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile
- `GET /api/profile/:username` - Get public profile
- `PATCH /api/profile/preferences` - Update preferences
- `GET /api/profile/preferences` - Get preferences
- `POST /api/profile/email-notifications` - Toggle email notifications
- `DELETE /api/profile/account` - Delete account
- `PATCH /api/profile/email` - Change email

## How Bart Works

1. **API Testing**: Bart makes HTTP requests to each endpoint and validates responses
2. **Smart Validation**: Checks for proper status codes (200, 401, 403, 404, etc.)
3. **Router Verification**: Ensures no endpoints return 404 (which means they're not mounted)
4. **AI Analysis**: Uses OpenAI GPT-4o-mini to analyze failures and suggest fixes
5. **Detailed Reporting**: Generates comprehensive pass/fail reports with actionable insights

## Understanding Test Results

### ✅ Pass Criteria
- Endpoint returns expected status code (200, 401, 403, etc.)
- No 404 errors (unless testing for non-existent resources)
- Proper authentication enforcement

### ❌ Failure Indicators
- **404 Not Found**: Router not mounted correctly (critical!)
- **Unexpected 200**: Missing authentication middleware
- **500 Server Error**: Application error (needs debugging)

## AI Analysis

When tests fail, Bart uses OpenAI to provide:
- **Root cause analysis** - What went wrong and why
- **Suggested fixes** - Specific code changes needed
- **Overall assessment** - Health of the refactoring/changes

Example AI output:
```
Root Cause: The authentication middleware may not be properly applied 
to the new route structure in contracts.ts.

Likely Fix: Verify that the authentication middleware is correctly 
applied to the /api/consent-contracts endpoint.
```

## Exit Codes

- **0**: All tests passed ✅
- **1**: One or more tests failed ❌

Use in CI/CD:
```bash
npx tsx bart.ts || echo "Tests failed!"
```

## Environment Requirements

- **Required**: Running PMY server on `localhost:5000`
- **Optional**: `OPENAI_API_KEY` for AI-powered failure analysis

## Troubleshooting

### "Connection refused" errors
Make sure the PMY server is running:
```bash
npm run dev
```

### "AI analysis skipped"
Set the `OPENAI_API_KEY` environment variable (already configured in this project).

### Tests passing but app not working
Bart only tests API routing and authentication. It doesn't test:
- UI rendering
- Client-side logic
- Database integrity
- Full e2e user flows

For those, you'd need browser-based testing (which we can't use due to the Stripe blocker).

## Customizing Bart

Want to add more tests? Edit `bart.ts` and add new test methods:

```typescript
async testMyNewFeature() {
  await this.testEndpoint(
    'GET /api/my-endpoint',
    '/api/my-endpoint',
    [200, 401], // Expected status codes
    [404]       // Should NOT return these
  );
}
```

Then call it in `main()`:
```typescript
await agent.testMyNewFeature();
```

## Credits

Bart was created to solve the Stripe testing blocker in Replit's built-in testing framework. Named for easy communication ("Ask Bart to test the changes").

Built with:
- **OpenAI GPT-4o-mini** - AI-powered failure analysis
- **Node.js Fetch API** - Lightweight HTTP testing
- **TypeScript** - Type-safe test code

---

**Next Steps:**
- Run Bart after making routing changes
- Use AI analysis to quickly diagnose issues
- Keep endpoints covered as you add new features
