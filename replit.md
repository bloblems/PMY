# PMY - Title IX Consent Documentation App

## Overview
PMY is a mobile-first web application designed to document consent in compliance with Title IX regulations. It offers multiple methods for consent capture, including digital signatures, audio recordings, photo/selfie capture, and biometric authentication. The application also provides educational resources on Title IX consent, tailored to specific universities. PMY aims to be a secure, legally compliant platform, adhering to Apple's Human Interface Guidelines and legal-tech best practices, with the goal of becoming a leading solution for Title IX compliance and education within academic institutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application adheres to Apple Human Interface Guidelines, featuring a mobile-first, fully responsive layout with light and dark mode support. It uses a system font stack, a clear heading hierarchy, and Tailwind CSS with custom design tokens for styling. Core UI components include a bottom navigation bar, card-based layouts, inline confirmations (no modal dialogs), and iOS-standard toast notifications. The primary action, consent creation, is immediately accessible from the homepage, emphasizing a consent-first approach.

**Color Policy - Unified Red (Destructive):**
All red/error/destructive UI elements use the semantic `destructive` color variable defined in `index.css`:
- Light mode: `--destructive: 0 84% 60%` (red-600 equivalent)
- Dark mode: `--destructive: 0 91% 71%` (red-400 equivalent)
- Usage: Always use `border-destructive`, `bg-destructive`, `text-destructive` classes
- Never use: Hardcoded `red-500`, `red-600`, `red-400` or similar Tailwind color classes
- Applies to: Error messages, destructive buttons, "NO" selections in consent forms, recording indicators, toast notifications, validation errors

**Responsive Design:** The layout adapts across all Apple devices using responsive breakpoints:
- iPhone (default - 375px to 430px): Single-column, max-width 28rem (448px) with 4-6 padding
- iPad Mini/Air (md - 768px+): Centered layout, max-width 42rem (672px) with increased content width
- iPad Pro (lg - 1024px+): Centered layout, max-width 48rem (768px) for optimal reading width
- Payment methods grid uses 2 columns on tablets (md+) for better space utilization
- All inline confirmations and destructive actions remain iOS-native styled across all screen sizes

### Technical Implementations
The frontend is built with React 18 and TypeScript, utilizing Vite, Wouter for routing, and TanStack Query for server state management. UI components are derived from shadcn/ui (Radix UI) and styled with Tailwind CSS. Form validation is handled by `react-hook-form` and `zod`. The backend uses Express.js with Node.js and TypeScript, providing RESTful API endpoints and handling file uploads via Multer. Drizzle ORM facilitates type-safe PostgreSQL interactions with Neon serverless.

### Feature Specifications
- **Consent Documentation**: Supports digital signature capture, audio recording, photo/selfie capture, and biometric authentication (WebAuthn). The consent flow dynamically adjusts between a 5-step or 6-step process based on encounter type and user selections. Step 4 features a three-state intimate acts selection system (unselected, YES with green checkmark, NO with red X) that cycles through states on tap, making explicit consent and non-consent legally clear. The optional contract duration step (Step 5) uses an iOS-style circular graphical picker with day/night indicators, allowing users to specify start time and duration with automatic end time calculation. Duration fields are stored as `contractStartTime` (timestamp), `contractDuration` (integer minutes), and `contractEndTime` (timestamp). University selection is conditional. Contract generation includes both university-specific and generic Title IX-compliant language.
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
- **Security**: Comprehensive measures include `isAuthenticated` middleware for all sensitive endpoints, user data isolation by `userId`, ownership verification for all read/delete operations, PBKDF2 password hashing, SHA256 hashed password reset tokens, PostgreSQL-backed session management with secure cookies, CSRF protection, email normalization, cascading deletions, Stripe-first payment method security, server-side file upload validation, structured security audit logging, WebAuthn for biometric authentication, encrypted storage on native platforms, and rate limiting for email-sending features.
- **Testing**: Comprehensive automated test strategy documented in `test-strategy.md` covering 50+ test cases across 4 phases: Critical Security (data isolation, authentication, file upload), Core Functionality (all 4 consent methods, account management, payments), Integration (Stripe webhooks, data retention, cascading deletes), and Polish (responsive design, edge cases, email). Playwright-based E2E tests with OIDC test authentication support.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`
- **Frontend Frameworks/Libraries**: `react`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `zod`, `react-signature-canvas`
- **UI Libraries**: `@radix-ui/*`, `tailwindcss`, `shadcn/ui`, `class-variance-authority`, `cmdk`
- **Backend Frameworks/Libraries**: `express`, `multer`, `tsx`, `esbuild`, `@simplewebauthn/server`, `ws`, `express-rate-limit`
- **iOS/Native Integration**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/preferences`, `capacitor-secure-storage-plugin`
- **AI Services**: `OpenAI API` (GPT-4o-mini, GPT-4, GPT-4o)
- **Payment Processing**: `Stripe`
- **Email Services**: `Resend API`
- **Authentication**: `passport`, `express-session`, `@simplewebauthn/browser`