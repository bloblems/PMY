# PMY Test Strategy & Implementation Guide

## Overview
This document outlines the comprehensive testing strategy for PMY, a Title IX-compliant consent documentation application. Given the critical nature of legal compliance, data security, and payment processing, robust automated testing is essential.

## Test Framework
- **API Testing (Primary)**: Bart's 54-endpoint test battery validates all authentication, routing, and security controls (`npx tsx bart.ts`)
- **E2E Testing (Feature Validation)**: Playwright-based tests via `run_test` tool for UI/UX workflows and integration testing
- **Integration Testing**: External service mocking (Stripe, Resend, WebAuthn)
- **Test Database**: Uses development database with test data isolation

## Primary Testing System: Bart

PMY uses **Bart** as its primary API testing system. Bart is a comprehensive testing agent that validates all 54 endpoints across 8 domain routers:

- **Contracts Router** (23 endpoints): CRUD operations, consent creation, collaborative contracts, AI services
- **Profile Router** (8 endpoints): User profiles, preferences, email settings
- **Auth Router** (6 endpoints): Authentication, registration, WebAuthn
- **Amendments Router** (4 endpoints): Contract amendment workflows
- **Notifications Router** (4 endpoints): Notification management
- **Recordings Router** (3 endpoints): Audio recording management
- **Universities Router** (2 endpoints): University data access
- **State Laws Router** (2 endpoints): State consent law data
- **App Health** (2 tests): Server status and configuration

**Running Bart:**
```bash
npx tsx bart.ts
```

**What Bart Validates:**
- ✅ All 54 endpoints return expected status codes
- ✅ Authentication middleware properly protects sensitive routes
- ✅ Routing architecture works correctly across all 8 domain routers
- ✅ API responses follow expected structure
- ✅ Security controls prevent unauthorized access

**Bart Test Results:** 100% pass rate (54/54 tests) as of last run.

See `BART_README.md` for complete documentation on Bart's testing approach and persona.

---

## Supplementary E2E Testing

While Bart validates API functionality and security, Playwright E2E tests validate:
- Complete user workflows through the UI
- Browser-specific behaviors
- Visual regressions
- Integration between frontend and backend
- Features requiring actual browser interaction (forms, modals, navigation)

## Test Organization

### Phase 1: Critical Security Tests (HIGHEST PRIORITY)
**Goal**: Ensure data security, access control, and compliance with legal requirements

#### 1.1 Data Isolation & Access Control
- **Test: User can only access their own consent records**
  - Create consent records as User A
  - Login as User B
  - Verify User B cannot access User A's records
  - Test all endpoints: GET /api/recordings, GET /api/contracts, etc.
  
- **Test: User cannot delete other users' data**
  - Create record as User A
  - Login as User B
  - Attempt DELETE operations on User A's data
  - Verify 404/403 responses

- **Test: User cannot modify other users' data**
  - Attempt to update another user's retention policy
  - Attempt to share another user's documents
  - Verify all operations blocked

#### 1.2 Authentication & Session Security
- **Test: Unauthenticated access blocked on protected endpoints**
  - Test all protected routes without authentication
  - Verify 401 responses
  - Endpoints: /api/recordings, /api/contracts, /api/payment-methods, /api/settings

- **Test: CSRF protection active**
  - Make POST request without CSRF token
  - Verify request blocked
  - Make POST with valid CSRF token
  - Verify request succeeds

- **Test: Session management works correctly**
  - Login and verify session created
  - Make authenticated requests
  - Test session persistence across page reloads

#### 1.3 File Upload Security
- **Test: Malicious file uploads blocked**
  - Upload executable file as audio
  - Upload oversized file (>10MB)
  - Upload invalid MIME type
  - Verify all blocked with appropriate errors

- **Test: File type validation enforces allowed types**
  - Upload valid audio (MP3, WAV)
  - Upload valid image (JPG, PNG, HEIC)
  - Verify accepted
  - Upload text file as audio
  - Upload PDF as image
  - Verify rejected

- **Test: File size limits enforced**
  - Upload file just under limit
  - Upload file just over limit
  - Verify appropriate handling

---

### Phase 2: Core Functionality Tests (HIGH PRIORITY)
**Goal**: Verify all primary user workflows function correctly

#### 2.1 Consent Creation - Digital Signature
- **Test: Complete digital signature consent flow**
  - Navigate through all steps: encounter type → parties → intimate acts → signature
  - Complete signature capture
  - Verify contract created with correct data
  - Verify contract appears in files list
  - Verify contract downloadable

- **Test: Multi-party signature flow**
  - Add 3+ parties
  - Complete signatures for all parties
  - Verify all parties recorded

- **Test: University-specific consent flow (5-step)**
  - Select "Intimate Encounter" or "Date"
  - Verify university selection step appears
  - Complete with university selected
  - Verify contract includes university info

#### 2.2 Consent Creation - Voice Recording
- **Test: Complete voice recording consent flow**
  - Navigate to voice recording step
  - Upload audio file
  - Verify recording saved
  - Verify metadata correct (duration, filename)
  - Verify audio appears in files list

- **Test: Audio format validation**
  - Upload MP3
  - Upload WAV
  - Upload M4A
  - Verify all accepted
  - Upload MP4 (video)
  - Verify rejected

#### 2.3 Consent Creation - Photo/Selfie
- **Test: Complete photo consent flow**
  - Navigate to photo step
  - Upload photo
  - Verify photo consent contract created
  - Verify photo embedded correctly
  - Verify appears in files list

- **Test: Image format validation**
  - Upload JPG, PNG, HEIC
  - Verify all accepted
  - Upload GIF, BMP
  - Verify appropriate handling

#### 2.4 Consent Creation - Biometric (WebAuthn)
- **Test: Complete biometric authentication flow**
  - Navigate to biometric step
  - Trigger WebAuthn authentication
  - Verify credential created
  - Verify server verification
  - Verify biometric contract created

- **Test: Biometric verification data stored correctly**
  - Complete biometric flow
  - Verify credentialId, publicKey, counter stored
  - Verify cryptographic data integrity

#### 2.5 Account Management - Email Change
- **Test: Change email address**
  - Navigate to account settings
  - Click "Change Email"
  - Enter new email
  - Verify inline form appears
  - Submit new email
  - Verify success toast
  - Verify email updated in database

- **Test: Email validation**
  - Attempt invalid email format
  - Verify validation error
  - Attempt duplicate email
  - Verify appropriate error

#### 2.6 Account Management - Data Retention
- **Test: Update data retention policy**
  - Select 30 days retention
  - Save and verify
  - Select 90 days retention
  - Save and verify
  - Select "Keep Forever"
  - Save and verify

- **Test: Retention policy persists**
  - Set retention policy
  - Logout and login
  - Verify policy still set correctly

#### 2.7 Account Management - Delete Data (Inline Confirmation)
- **Test: Delete consent data with inline confirmation**
  - Click "Delete Consent Data"
  - Verify inline confirmation appears (no modal)
  - Click cancel
  - Verify confirmation collapses
  - Click "Delete Consent Data" again
  - Confirm deletion
  - Verify data deleted from database
  - Verify success toast

#### 2.8 Account Management - Delete Account (Inline with Hold)
- **Test: Delete account with inline confirmation and hold**
  - Click "Delete Account"
  - Verify inline confirmation expands
  - Type "delete" in confirmation field
  - Hold button for 3 seconds
  - Verify account deleted
  - Verify redirect to login
  - Verify cannot login with old credentials

- **Test: Delete account validation**
  - Click "Delete Account"
  - Don't type "delete"
  - Attempt to hold button
  - Verify button disabled until text entered
  - Type "delete"
  - Release before 3 seconds
  - Verify account NOT deleted

#### 2.9 Payment Methods - Add Payment Method
- **Test: Add credit card via Stripe Elements**
  - Click "Add Payment Method"
  - Fill Stripe Elements with test card
  - Submit
  - Verify payment method appears in list
  - Verify saved to database with correct userId
  - Verify Stripe customer created if first payment method

- **Test: Multiple payment methods**
  - Add 2+ payment methods
  - Verify all appear in list
  - Verify first is marked default

#### 2.10 Payment Methods - Set Default
- **Test: Set default payment method**
  - Have 2+ payment methods
  - Click "Set as Default" on second method
  - Verify badge moves to second method
  - Verify Stripe customer default updated
  - Verify database updated

#### 2.11 Payment Methods - Delete (Inline Confirmation)
- **Test: Delete payment method with inline confirmation**
  - Click "Remove" on payment method
  - Verify inline confirmation appears within card
  - Click cancel
  - Verify confirmation collapses
  - Click "Remove" again
  - Confirm deletion
  - Verify removed from Stripe
  - Verify removed from database
  - Verify success toast

- **Test: Delete default payment method**
  - Delete the default payment method
  - Verify another method auto-promoted to default
  - Verify Stripe customer default updated

#### 2.12 Payment Methods - Stripe Synchronization
- **Test: Sync payment methods from Stripe**
  - Create payment method directly in Stripe (bypass app)
  - Click sync button in app
  - Verify new method appears
  - Delete method in Stripe
  - Click sync button
  - Verify method removed from app

---

### Phase 3: Integration & Data Integrity Tests (MEDIUM PRIORITY)
**Goal**: Ensure integrations work correctly and data remains consistent

#### 3.1 Stripe Checkout & Webhooks
- **Test: University verification payment flow**
  - Select university
  - Select AI model (GPT-4, GPT-4 Turbo, GPT-4o)
  - Create checkout session
  - Verify session created in Stripe
  - Complete payment (test mode)
  - Verify webhook received
  - Verify payment status updated to "paid"
  - Verify verification status updated to "processing"

- **Test: Webhook signature verification**
  - Send webhook with invalid signature
  - Verify rejected
  - Send valid webhook
  - Verify processed

#### 3.2 Data Retention & Cleanup
- **Test: Automatic cleanup for 30-day retention**
  - Create user with 30-day retention
  - Create consent record
  - Mock date to 31 days later
  - Run cleanup job
  - Verify record deleted

- **Test: "Keep Forever" prevents deletion**
  - Create user with "forever" retention
  - Create old consent record (100+ days)
  - Run cleanup job
  - Verify record NOT deleted

- **Test: Cleanup respects different retention policies**
  - Create users with 30 days, 90 days, 1 year policies
  - Create records for each at various ages
  - Run cleanup
  - Verify only appropriate records deleted

#### 3.3 Cascading Deletions
- **Test: Account deletion removes all user data**
  - Create user with:
    - Multiple consent records (contracts, recordings)
    - Payment methods
    - Referrals
  - Delete account
  - Verify all consent records deleted
  - Verify all payment methods deleted
  - Verify all referrals deleted
  - Verify user record deleted
  - Verify no orphaned data

- **Test: Payment method deletion cascading**
  - Delete payment method
  - Verify removed from Stripe
  - Verify removed from database
  - Verify no orphaned references

---

### Phase 4: Polish & Edge Cases (LOWER PRIORITY)
**Goal**: Handle edge cases and ensure excellent UX across devices

#### 4.1 Responsive Design Verification
- **Test: iPhone SE (375px)**
  - Navigate key pages
  - Verify no horizontal scroll
  - Verify inline confirmations work
  - Verify forms usable

- **Test: iPhone 14 Pro Max (430px)**
  - Verify layout adapts
  - Verify spacing appropriate

- **Test: iPad Mini (768px)**
  - Verify content expands to ~672px
  - Verify payment methods show 2 columns
  - Verify centered layout

- **Test: iPad Pro 12.9" (1024px)**
  - Verify max width ~768px
  - Verify content centered
  - Verify 2-column payment grid

#### 4.2 Error Handling
- **Test: Network errors handled gracefully**
  - Mock failed API calls
  - Verify toast error messages
  - Verify loading states cleared
  - Verify can retry

- **Test: Invalid form data**
  - Submit empty forms
  - Submit invalid data
  - Verify validation errors
  - Verify cannot proceed

- **Test: Concurrent operations**
  - Start two deletions simultaneously
  - Verify both handled correctly
  - Verify no race conditions

#### 4.3 Email & Communication
- **Test: Share document via email**
  - Share contract to email
  - Verify email sent via Resend
  - Verify recipient receives email

- **Test: Share document rate limiting**
  - Share 5 documents rapidly
  - Attempt 6th share
  - Verify rate limit blocks
  - Wait for rate limit reset
  - Verify can share again

- **Test: Referral invitation flow**
  - Send referral invite
  - Verify email sent
  - Verify referral code tracked
  - Simulate signup with code
  - Verify referral credited

---

## Test Data Management

### User Test Data
- **User A**: Primary test user (email: `testa@test.com`, password: `TestPass123!`)
- **User B**: Secondary user for isolation testing (email: `testb@test.com`, password: `TestPass123!`)
- **User C**: Edge case testing (email: `testc@test.com`, password: `TestPass123!`)

### Test Content
- **Universities**: Use pre-seeded universities from database
- **Encounter Types**: "Intimate Encounter", "Date", "Social Gathering", "Professional Meeting"
- **Party Names**: Generate unique names per test using nanoid()
- **Stripe Test Cards**: 
  - Success: `4242424242424242`
  - Decline: `4000000000000002`
  - Authentication Required: `4000002500003155`

---

## Implementation Guidelines

### Test Structure
Each test should follow this pattern:
```
1. [New Context] Create new browser context
2. [DB] Set up test data if needed
3. [OIDC] Configure login claims
4. [Browser] Navigate and interact
5. [Verify] Assert expected outcomes
6. [DB] Verify database state if needed
7. [Cleanup] Clean up test data if needed
```

### Test Isolation
- Each test creates its own user(s)
- Use unique identifiers (nanoid()) for all created data
- Tests should not depend on each other
- Database state should be verified explicitly

### Test Assertions
- Verify UI state (elements visible, text content)
- Verify database state (records created/deleted)
- Verify external service calls (Stripe, Resend)
- Verify error handling (toast messages, validation)

---

## Success Criteria

### Phase 1 (Security)
- ✅ All data isolation tests pass
- ✅ All authentication tests pass
- ✅ All file upload security tests pass
- ✅ Zero security vulnerabilities in test coverage

### Phase 2 (Core Functionality)
- ✅ All 4 consent methods fully tested
- ✅ Account management flows fully tested
- ✅ Payment management flows fully tested
- ✅ All critical user paths covered

### Phase 3 (Integration)
- ✅ Stripe integration fully tested
- ✅ Data retention working correctly
- ✅ Cascading deletions verified
- ✅ No data integrity issues

### Phase 4 (Polish)
- ✅ Responsive design verified
- ✅ Edge cases handled
- ✅ Email flows tested
- ✅ Error handling comprehensive

---

## Maintenance

### When to Update Tests
- When adding new features
- When modifying existing workflows
- When fixing bugs (add regression test)
- When changing database schema
- When updating external integrations

### Test Review Schedule
- Weekly: Review failed tests
- Monthly: Review test coverage metrics
- Quarterly: Comprehensive test strategy review

---

## Appendix: Endpoint Reference

### Authentication Endpoints
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user

### Consent Endpoints
- POST `/api/consent-contracts` - Create signature contract
- POST `/api/consent-recordings` - Create voice recording
- POST `/api/consent-photos` - Create photo consent
- POST `/api/consent-biometric` - Create biometric consent
- GET `/api/consent-contracts` - List user's contracts
- GET `/api/recordings` - List user's recordings
- DELETE `/api/recordings/:id` - Delete recording
- DELETE `/api/contracts/:id` - Delete contract

### Account Management Endpoints
- PATCH `/api/users/:id/email` - Change email
- PATCH `/api/users/:id/retention-policy` - Update retention policy
- DELETE `/api/users/:id/data` - Delete all consent data
- DELETE `/api/users/:id` - Delete account

### Payment Endpoints
- GET `/api/payment-methods` - List payment methods
- POST `/api/payment-methods` - Add payment method
- POST `/api/payment-methods/:id/set-default` - Set default
- DELETE `/api/payment-methods/:id` - Delete payment method
- POST `/api/payment-methods/setup-intent` - Create setup intent
- POST `/api/payment-methods/sync-from-stripe` - Sync from Stripe

### Verification Endpoints
- POST `/api/verify/create-checkout` - Create checkout session
- POST `/api/verify/webhook` - Stripe webhook handler

### Sharing Endpoints
- POST `/api/share-document` - Share document via email
- POST `/api/referrals` - Send referral invitation
- GET `/api/referrals` - Get referral stats

---

**Last Updated**: 2025-01-16  
**Version**: 1.0  
**Status**: Implementation in Progress
