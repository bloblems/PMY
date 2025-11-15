# PMY - Title IX Consent Documentation App

## Overview
PMY is a mobile-first web application for documenting consent in accordance with Title IX requirements. It provides four consent documentation methods: digital signature contracts, audio recording for verbal agreements, photo/selfie capture, and biometric authentication using Touch ID/Face ID/Windows Hello. The app also provides educational information about Title IX consent, customized by university. The application aims to be a secure, legally sound platform adhering to Apple's Human Interface Guidelines and legal-tech patterns, with the ambition to become a leading solution for Title IX compliance and education in academic institutions.

**iOS Deployment Strategy**: The application is architected for deployment as an iOS app using a two-phase approach: (1) Quick launch via Capacitor WebView container wrapping the existing React app, (2) Long-term enhancement with React Native modules for native features. Current architecture already aligns with iOS requirements through React Context state management, Apple HIG design patterns, and mobile-first responsive layout. See `IOS_DEPLOYMENT_STRATEGY.md` for complete roadmap.

## User Preferences
Preferred communication style: Simple, everyday language.

## Security Guidelines
See `SECURITY_GUIDELINES.md` for comprehensive security design guidelines. All development must follow these security priorities to prevent Tea App-style data breaches.

## System Architecture

### UI/UX Decisions
The application follows Apple Human Interface Guidelines with a mobile-first, single-column layout (max-width: 448px), supporting both light and dark modes. It uses a system font stack, structured heading hierarchy, and Tailwind CSS for styling with custom design tokens. Key UI elements include a bottom navigation bar, card-based layouts, accordions, and toast notifications. The app uses a consent-first approach where the home page (/) immediately starts the consent creation flow, making the primary action instantly accessible. A "Press for Yes" button on the Title IX information page provides an alternative entry point with university context.

### Technical Implementations
The frontend is built with React 18 and TypeScript, using Vite, Wouter for routing, and TanStack Query for server state. UI components are derived from shadcn/ui (Radix UI) and Tailwind CSS. Form validation is handled with `react-hook-form` and `zod`. The backend uses Express.js with Node.js and TypeScript, handling RESTful API endpoints and file uploads via Multer. Drizzle ORM provides type-safe PostgreSQL operations with Neon serverless.

### Feature Specifications
- **Consent Documentation**: Supports digital signature capture (`react-signature-canvas`), audio recording (Media Recorder API), photo/selfie capture, and biometric authentication (WebAuthn for Touch ID/Face ID/Windows Hello) for consent. The app features a dynamic consent flow that adapts based on encounter type selection:
  - **5-Step Flow** (for "Intimate Encounter" and "Date"): (1) encounter type, (2) university selection, (3) parties involved, (4) intimate acts (optional), (5) recording method
  - **4-Step Flow** (for "Social Gathering", "Conversation", "Medical Consultation", "Professional Interaction", "Other"): (1) encounter type, (2) parties involved, (3) intimate acts (optional), (4) recording method
  - University selection is conditionally required only for encounters where institutional Title IX policies are most relevant
  - When encounter type changes mid-flow, all state (university, parties, intimate acts) is cleared and step resets to prevent confusion
  - No auto-selection of universities - requires explicit user interaction
  - Contract generation supports both university-specific (with policy excerpts) and generic Title IX-compliant consent language
  - All recording methods properly handle nullable universityId (FormData omits field when empty, JSON sends null)
- **Title IX Information**: Provides educational content about Title IX requirements, customized per university (accessible at /titleix). It includes a comprehensive system for managing, updating, and verifying university Title IX policies. OpenAI GPT-4o-mini is used to summarize Title IX policies for universities.
- **Tools**: Quick access panel page (accessible at /tools) with three convenient tool panels: Title IX (view policies), ID Verify (access verification integrations), and Status Check (check consent documentation status). Each panel provides a direct action button and navigation to relevant features.
- **Integrations Settings**: Comprehensive integrations page (accessible at /settings/integrations) showcasing third-party ID verification and age verification services. Currently features Stripe Identity (available for configuration) and displays upcoming integrations including Persona, Onfido, Veriff, Sumsub, and iDenfy. Each integration card displays status, features, pricing, and documentation links. Accessible via Settings menu.
- **University Policy Preview**: When selecting a university during consent flow, displays AI-generated policy summary, verification status, and last updated date to help users make informed decisions.
- **User Management**: Secure user authentication with email/password, PBKDF2 hashing, and session management using Express-session and Passport.js.
- **University Data**: Automatically seeds a database with 287 US universities, including detailed Title IX information.
- **Paid Verification**: Users can pay via Stripe to have university Title IX policies verified using advanced AI models (GPT-4, GPT-4 Turbo, GPT-4o).
- **Sharing & Referrals**: Dropbox-style referral program with email invitations via Resend API. Users can share consent documents via email with professional HTML templates. Rate limiting prevents abuse (10 referral invitations/hour, 20 document shares/hour per user). All sharing operations verify ownership before allowing access to prevent data leakage.

### System Design Choices
- **Database Schema**: Includes tables for `universities`, `consentRecordings`, `consentContracts`, `universityReports`, `users`, and `verificationPayments`.
- **API Design**: RESTful APIs for CRUD operations on core entities, supporting multipart form data for uploads.
- **State Management**: Frontend uses TanStack Query for server state and React Context API with cross-platform storage abstraction for maintaining state across multi-step consent flows. The ConsentFlowContext provides centralized state management with automatic persistence, supporting browser back/forward navigation, page refreshes, and iOS WebView compatibility. All consent method pages implement defensive routing with isHydrated flag to prevent access before async storage loads.
- **iOS-Ready Secure Storage**: Implemented production-ready storage abstraction layer (`client/src/services/storage.ts`):
  - **StorageService Interface**: Cross-platform abstraction for unified storage API
  - **SecureStorageService**: AES-256 encrypted Keychain storage on iOS via `capacitor-secure-storage-plugin`, hardware-backed Keystore on Android, with automatic fallback to sessionStorage on web. Uses `Capacitor.getPlatform()` for synchronous platform detection to ensure correct storage selected before first access.
  - **WebStorageService**: Browser-compatible sessionStorage with in-memory fallback for private browsing mode
  - **Platform Detection**: Synchronous detection using `Capacitor.getPlatform() === 'ios' | 'android' | 'web'` ensures correct storage from first call
  - **Security Guarantees**: On native platforms, consent data encrypted at rest, protected by device passcode/biometrics, sandboxed per-app. On web, session-based storage with no plaintext persistence after browser close.
  - **Capacitor Configuration**: `capacitor.config.ts` initialized for iOS deployment with webDir, server, and iOS-specific settings
- **Navigation**: Bottom navigation bar with 4 tabs: Create (home/consent flow), Tools (quick access to Title IX, ID verification, and status checks), Contracts (saved documents), and Share. The consent-first architecture makes consent creation immediately accessible at the home route (/). Tools serves as a hub providing access to Title IX information and verification integrations.
- **Security**: Implements comprehensive security measures to prevent Tea App-style data breaches:
  - **Authentication**: All consent data endpoints require `isAuthenticated` middleware (recordings, contracts, photos, biometric)
  - **User Data Isolation**: Every consent record (contracts, recordings) is scoped to `userId` from authenticated session, preventing cross-user data access
  - **Ownership Verification**: All read/delete operations verify ownership before returning data (returns 404 for unauthorized access)
  - **Delete Authorization**: Delete methods return boolean indicating success; endpoints return 404 when user doesn't own the resource
  - **Password Security**: PBKDF2 hashing with salt for user passwords
  - **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple` with automatic pruning, 7-day rolling sessions, secure/httpOnly/sameSite=strict cookies
  - **CSRF Protection**: Double-submit cookie pattern with SameSite=strict cookies, applied to all state-changing endpoints, iOS/Capacitor compatible
  - **File Upload Validation**: Server-side MIME type sniffing with allowlists, iOS-native format support (CAF/AAC/M4A), size limits (10MB audio, 5MB photos)
  - **Security Audit Logging**: Comprehensive structured logging for auth events, consent operations, file uploads, rate limit violations, and CSRF failures - ready for SIEM integration
  - **Biometric Authentication**: WebAuthn for Touch ID/Face ID/Windows Hello (biometric data stays on-device)
  - **Encrypted Storage**: AES-256 Keychain/Keystore integration for consent flow state on iOS/Android
  - **Rate Limiting**: Express-rate-limit middleware prevents abuse of email-sending features (10 referral invitations/hour, 20 document shares/hour per user), violations logged for monitoring

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`
- **Frontend Frameworks/Libraries**: `react`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `zod`, `react-signature-canvas`
- **UI Libraries**: `@radix-ui/*`, `tailwindcss`, `shadcn/ui`, `class-variance-authority`, `cmdk`
- **Backend Frameworks/Libraries**: `express`, `multer`, `tsx`, `esbuild`, `@simplewebauthn/server`, `ws`, `express-rate-limit`
- **iOS/Native Integration**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/preferences`, `capacitor-secure-storage-plugin`
- **AI Services**: `OpenAI API` (GPT-4o-mini, GPT-4, GPT-4o)
- **Payment Processing**: `Stripe`
- **Email Services**: `Resend API` (transactional emails for referrals and document sharing)
- **Authentication**: `passport`, `express-session`, `@simplewebauthn/browser`