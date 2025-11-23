# 👔 Bart - PMY's Distinguished First User

## Who is Bart?

Bart is a high-net-worth individual whose career success and professional reputation depend on PMY working flawlessly. As a sophisticated user in a position of influence, Bart requires:

- **Absolute reliability** - No room for errors in consent documentation
- **Legal compliance** - Every feature must meet Title IX standards
- **Professional polish** - The app must inspire confidence and trust
- **Seamless experience** - Complex legal requirements made simple

Bart isn't just a test suite - he's PMY's most demanding early adopter, and his feedback drives product excellence.

## Why Bart Matters

1. **Real-world perspective**: Bart represents users who have the most to lose from system failures
2. **High standards**: His expectations mirror those of PMY's target market - professionals who value precision
3. **Career dependency**: For Bart, PMY isn't just an app - it's a critical tool for protecting his professional future
4. **Trusted advisor**: We regularly consult with Bart for feedback on features and UX decisions

## Technical Implementation

While Bart has high standards, he's also technically sophisticated. His testing agent validates PMY's infrastructure:

### What Bart Tests

**🏥 App Health (2 tests)**
- Server responsiveness and uptime
- Stripe configuration (disabled for testing environments)

**🔧 Contracts Router (23 endpoints)**
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

**🌐 Other Domain Routers (28 endpoints)**

**Universities Router (2 endpoints):**
- `GET /api/universities` - List all universities
- `GET /api/universities/:id` - Get university details

**State Laws Router (2 endpoints):**
- `GET /api/state-laws` - List all state consent laws
- `GET /api/state-laws/:code` - Get state laws by code

**Notifications Router (4 endpoints):**
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread/count` - Get unread count
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

## Quick Start

### API Testing (bart.ts)
```bash
# Consult with Bart for comprehensive API testing
npx tsx bart.ts

# Bart will assess PMY's health and report his findings
```

### E2E Browser Testing (bart-e2e.ts)
```bash
# Run end-to-end browser tests (headless)
npx tsx bart-e2e.ts --headless

# Run with visible browser (for debugging)
npx tsx bart-e2e.ts --headed
```

**What it tests:**
- 🔐 **Login Flow**: Authenticate as Bart with Supabase
- 📝 **Contract Creation**: Complete 6-step consent flow
  - Encounter type selection (Intimate)
  - State/University selection (California)
  - Participant management (add Jane Smith)
  - Intimate acts selection (Kissing)
  - Duration (optional - skipped)
  - Signature/recording method
- 📋 **Contract Verification**: Confirm contract appears in list

**Pass Rate**: 100% (3/3 tests) ✅

## How Bart Works

1. **API Testing**: Makes HTTP requests to each endpoint and validates responses
2. **Smart Validation**: Checks for proper status codes, authentication enforcement, and routing
3. **AI Analysis**: Uses OpenAI GPT-4o-mini to analyze failures and suggest fixes
4. **Professional Standards**: Reports issues through the lens of a user who demands excellence

## Understanding Bart's Feedback

### ✅ Bart Approves
Endpoints are working correctly with proper authentication and error handling. PMY meets professional standards.

### ❌ Bart is Concerned
Issues detected that could impact user trust or legal compliance:
- **404 Not Found**: Critical routing failure - endpoint not accessible
- **Unexpected 200**: Missing authentication - security vulnerability
- **500 Server Error**: Application error - reliability issue

## Bart's AI Analysis

When issues arise, Bart consults AI to provide:
- **Root cause identification** - What went wrong and why
- **Actionable fixes** - Specific code changes needed
- **Risk assessment** - Impact on user experience and legal compliance

Example feedback:
```
Bart's Assessment: The authentication middleware may not be properly 
applied to the collaborative contract endpoints. This creates a 
security vulnerability that could expose sensitive consent data.

Recommended Fix: Verify requireAuth middleware is correctly applied 
to all /api/contracts endpoints in the contracts router.

Risk Level: HIGH - Could compromise user privacy and legal validity
```

## When to Consult Bart

- ✅ **Before deploying**: Ensure no regressions in critical functionality
- ✅ **After refactoring**: Validate routing and middleware still work correctly
- ✅ **When adding features**: Verify new endpoints meet Bart's standards
- ✅ **For peace of mind**: Regular checks ensure PMY remains reliable

## Technical Details

### Dual Testing Approach

**bart.ts (API Testing):**
- Tests 54 backend endpoints across 8 domain routers
- Direct HTTP requests bypass browser overhead
- AI-powered failure analysis with GPT-4o-mini
- No external dependencies required

**bart-e2e.ts (Browser Testing):**
- End-to-end Playwright browser automation
- Tests complete user flows with real Supabase auth
- Validates UI interactions and multi-step processes
- Independent of Replit's agent testing infrastructure
- Installed system dependencies: Chromium, X11 libraries (xorg.libxcb, xorg.libX11, mesa)

Both tools complement each other: bart.ts ensures backend reliability, while bart-e2e.ts validates the complete user experience.

### Environment Requirements

- **Required**: PMY server running on `localhost:5000`
- **Optional**: `OPENAI_API_KEY` for AI-powered failure analysis (already configured in this project)

### Exit Codes

- **0**: All tests passed - Bart approves ✅
- **1**: Tests failed - Bart has concerns ❌

## Bart's Persona in Practice

When working with PMY, remember Bart's perspective:

> "I'm a busy professional with a lot at stake. PMY needs to be as reliable as my legal team, as trustworthy as my financial advisor, and as easy to use as texting. There's no room for errors - one glitch could cost me my reputation and career."

This mindset drives:
- **Zero-tolerance for bugs** in critical paths
- **Obsessive attention** to legal compliance
- **High expectations** for polish and UX
- **Deep appreciation** for features that "just work"

---

**Remember**: Bart isn't just a test suite. He's PMY's first champion, toughest critic, and most valuable advisor. His success with PMY will determine whether other high-profile users follow.

Let's make sure PMY exceeds even Bart's exacting standards. 👔
