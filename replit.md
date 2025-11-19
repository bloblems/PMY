# PMY - Title IX Consent Documentation App

## Overview
PMY is a mobile-first web application designed to document consent in compliance with Title IX regulations. It offers multiple methods for consent capture, including digital signatures, audio recordings, photo/selfie capture, and biometric authentication. The application also provides educational resources on Title IX consent, tailored to specific universities. PMY aims to be a secure, legally compliant platform, adhering to Apple's Human Interface Guidelines and legal-tech best practices, with the goal of becoming a leading solution for Title IX compliance and education within academic institutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application adheres to Apple Human Interface Guidelines, featuring a mobile-first, fully responsive layout with light and dark mode support. It uses a system font stack, a clear heading hierarchy, and Tailwind CSS with custom design tokens for styling. Core UI components include a bottom navigation bar, card-based layouts, inline confirmations (no modal dialogs), and iOS-standard toast notifications. The primary action, consent creation, is immediately accessible from the homepage, emphasizing a consent-first approach.

**Color Policy - Unified Semantic Colors:**

All color usage follows a semantic color system with no hardcoded Tailwind color classes:

*Red/Destructive (Errors, Warnings, Negative States):*
- Variable: `--destructive`
- Light mode: `0 84% 60%` (red-600 equivalent)
- Dark mode: `0 91% 71%` (red-400 equivalent)
- Usage: `border-destructive`, `bg-destructive`, `text-destructive`
- Applies to: Error messages, destructive buttons, "NO" selections in consent forms, recording indicators, validation errors

*Green/Success (Affirmative, Positive States):*
- Variable: `--success`
- Light mode: `142 71% 45%` (green-600 equivalent, matches primary)
- Dark mode: `142 71% 55%` (green-400 equivalent, slightly lighter)
- Usage: `border-success`, `bg-success`, `text-success`
- Applies to: "YES" selections, checkmarks, success alerts, verification badges, affirmative states, positive feedback

*Green/Primary (Brand, Main Actions):*
- Variable: `--primary` (already semantic)
- Used for: Primary buttons, branding, main CTAs, navigation highlights

**Policy:** Never use hardcoded color classes (`red-600`, `green-500`, etc.). Always use semantic variables (`destructive`, `success`, `primary`). This ensures consistent visual language, automatic dark mode support, and single-source-of-truth maintenance.

**Responsive Design:** The layout adapts across all Apple devices using responsive breakpoints:
- iPhone (default - 375px to 430px): Single-column, max-width 28rem (448px) with 4-6 padding
- iPad Mini/Air (md - 768px+): Centered layout, max-width 42rem (672px) with increased content width
- iPad Pro (lg - 1024px+): Centered layout, max-width 48rem (768px) for optimal reading width
- Payment methods grid uses 2 columns on tablets (md+) for better space utilization
- All inline confirmations and destructive actions remain iOS-native styled across all screen sizes

### Technical Implementations
The frontend is built with React 18 and TypeScript, utilizing Vite, Wouter for routing, and TanStack Query for server state management. UI components are derived from shadcn/ui (Radix UI) and styled with Tailwind CSS. Form validation is handled by `react-hook-form` and `zod`. The backend uses Express.js with Node.js and TypeScript, providing RESTful API endpoints and handling file uploads via Multer. Drizzle ORM facilitates type-safe PostgreSQL interactions with Neon serverless.

**Authentication Architecture (Supabase Auth):**
- Frontend: Uses Supabase Auth V3 API with PKCE flow for secure authentication
- Signup: `supabase.auth.signUp()` stores user name in `user_metadata`, creates session upon email confirmation
- Login: `supabase.auth.signInWithPassword()` creates authenticated session
- Password Reset: `supabase.auth.resetPasswordForEmail()` → `supabase.auth.updateUser()` flow
- Session Management: `useAuth` hook manages Supabase session state, provides loading gate in App.tsx to prevent premature API calls
- Authorization: All API requests include `Authorization: Bearer <supabase_jwt>` header via `getAuthHeaders()` in queryClient
- Backend: `requireAuth` middleware validates Supabase JWT tokens, extracts user data (id, email, name) from token
- User Profiles: Separate `user_profiles` table stores `savedSignature`, `dataRetentionPolicy`, `stripeCustomerId`, `referralCode`. Created automatically on first `/api/auth/me` call if not exists.
- Email confirmation: Handled gracefully with clear user messaging when session isn't immediately available

### Feature Specifications
- **Consent Documentation**: Supports digital signature capture, audio recording, photo/selfie capture, and biometric authentication (WebAuthn). The consent flow dynamically adjusts between a 5-step or 6-step process based on encounter type and user selections. Step 4 features a three-state intimate acts selection system (unselected, YES with green checkmark, NO with red X) that cycles through states on tap, making explicit consent and non-consent legally clear. The optional contract duration step (Step 5) offers three methods for setting duration: (1) Quick presets (1 hour, 4 hours, 1 day, 3 days, 1 week), (2) Manual date/time inputs with past-date warning support for documenting historical consent, and (3) iOS-style circular graphical picker with day/night indicators for visual time adjustment (shown only for durations ≤12 hours). The picker supports future start times, multi-day durations, and displays formatted duration with automatic end time calculation. Duration fields are stored as `contractStartTime` (timestamp), `contractDuration` (integer minutes), and `contractEndTime` (timestamp). University selection is conditional. Contract generation includes both university-specific and generic Title IX-compliant language.
- **Title IX Information**: Offers educational content about Title IX requirements, customized by university, accessible at `/titleix`. It includes a system for managing and verifying university Title IX policies, with OpenAI GPT-4o-mini used for policy summarization.
- **Tools**: A quick access panel at `/tools` provides sections for Title IX policies, ID verification, and consent documentation status checks.
- **Integrations Settings**: A dedicated page at `/settings/integrations` displays third-party ID and age verification services, currently featuring Stripe Identity with planned integrations for Persona, Onfido, Veriff, Sumsub, and iDenfy.
- **University Policy Preview**: During consent flow, an AI-generated summary of university policies, verification status, and last updated date is displayed.
- **User Management**: Secure authentication with email/password, PBKDF2 hashing, and session management using Express-session and Passport.js.
- **Account Management**: Accessible via `/settings/account`, allowing users to change email, customize data retention policies (30 days, 90 days, 1 year, forever), manually delete consent data, and comprehensively delete their account. All modifications are audit logged.
- **Billing & Payment Methods**: A billing page at `/settings/billing` enables management of PCI-compliant payment methods via Stripe Payment Methods API. It supports multiple payment methods, uses Stripe Elements for secure collection, and ensures Stripe-first synchronization for all operations with robust error logging and recovery mechanisms.
- **University Data**: A database pre-seeded with 287 US universities and their Title IX information.
- **Paid Verification**: Users can pay via Stripe for advanced AI models (GPT-4, GPT-4 Turbo, GPT-4o) to verify university Title IX policies.
- **Sharing & Referrals**: Features a Dropbox-style referral program using Resend API and allows sharing of consent documents via email. Rate limiting is applied to prevent abuse.

### System Design Choices
- **Database Schema**: Includes tables for `universities`, `consentRecordings`, `consentContracts`, `universityReports`, `users`, `verificationPayments`, and `payment_methods`. The `consentContracts` table includes optional duration fields: `contract_start_time` (timestamp), `contract_duration` (integer), and `contract_end_time` (timestamp). The `users` table contains `dataRetentionPolicy` and `stripeCustomerId`. `payment_methods` stores metadata, while Stripe manages sensitive payment data.
- **API Design**: RESTful APIs support CRUD operations and multipart form data for uploads.
- **State Management**: Frontend uses TanStack Query for server state and React Context API with a cross-platform storage abstraction for managing multi-step consent flow state, supporting browser navigation and iOS WebView compatibility.
- **iOS-Ready Secure Storage**: Implemented production-ready storage abstraction (`client/src/services/storage.ts`) using `SecureStorageService` for AES-256 encrypted Keychain storage on iOS (and Keystore on Android) with fallback to `sessionStorage` on web. This ensures secure, platform-appropriate data storage.
- **Navigation**: A bottom navigation bar with "Create", "Tools", "Contracts", and "Share" tabs. The "Create" tab serves as the primary entry for the consent flow.
- **Security**: Comprehensive measures include `requireAuth` middleware (Supabase JWT validation) for all sensitive endpoints, user data isolation by `userId`, ownership verification for all read/delete operations, Supabase Auth password hashing, PostgreSQL-backed user profiles, email normalization, cascading deletions, Stripe-first payment method security, server-side file upload validation, structured security audit logging, WebAuthn for biometric authentication, encrypted storage on native platforms, and rate limiting for email-sending features.
- **Testing**: Comprehensive automated test strategy documented in `test-strategy.md` covering 50+ test cases across 4 phases: Critical Security (data isolation, authentication, file upload), Core Functionality (all 4 consent methods, account management, payments), Integration (Stripe webhooks, data retention, cascading deletes), and Polish (responsive design, edge cases, email). Playwright-based E2E tests. **Test Auth Strategy**: Supabase Auth doesn't support OIDC bypass (Replit-specific feature). For automated tests, use Supabase service-role token or create test users via `supabase.auth.admin` API. Test-mode authentication can be implemented using environment-specific Supabase client configuration.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`
- **Frontend Frameworks/Libraries**: `react`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `zod`, `react-signature-canvas`
- **UI Libraries**: `@radix-ui/*`, `tailwindcss`, `shadcn/ui`, `class-variance-authority`, `cmdk`
- **Backend Frameworks/Libraries**: `express`, `multer`, `tsx`, `esbuild`, `@simplewebauthn/server`, `ws`, `express-rate-limit`
- **iOS/Native Integration**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/preferences`, `capacitor-secure-storage-plugin`
- **AI Services**: `OpenAI API` (GPT-4o-mini, GPT-4, GPT-4o)
- **Payment Processing**: `Stripe`
- **Email Services**: `Resend API`
- **Authentication**: `@supabase/supabase-js`, `@supabase/ssr`, `@simplewebauthn/browser`