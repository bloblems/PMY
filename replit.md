# PMY - Title IX Consent Documentation App

## Overview
PMY is a mobile-first web application for documenting consent in accordance with Title IX requirements. It provides four consent documentation methods: digital signature contracts, audio recording for verbal agreements, photo/selfie capture, and biometric authentication using Touch ID/Face ID/Windows Hello. The app also provides educational information about Title IX consent, customized by university. The application aims to be a secure, legally sound platform adhering to Apple's Human Interface Guidelines and legal-tech patterns, with the ambition to become a leading solution for Title IX compliance and education in academic institutions.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Tools & Integrations**: Showcases third-party ID verification and age verification services (accessible at /tools). Currently features Stripe Identity (available for configuration) and displays upcoming integrations including Persona, Onfido, Veriff, Sumsub, and iDenfy. Each integration card displays status, features, pricing, and documentation links.
- **University Policy Preview**: When selecting a university during consent flow, displays AI-generated policy summary, verification status, and last updated date to help users make informed decisions.
- **User Management**: Secure user authentication with email/password, PBKDF2 hashing, and session management using Express-session and Passport.js.
- **University Data**: Automatically seeds a database with 287 US universities, including detailed Title IX information.
- **Paid Verification**: Users can pay via Stripe to have university Title IX policies verified using advanced AI models (GPT-4, GPT-4 Turbo, GPT-4o).

### System Design Choices
- **Database Schema**: Includes tables for `universities`, `consentRecordings`, `consentContracts`, `universityReports`, `users`, and `verificationPayments`.
- **API Design**: RESTful APIs for CRUD operations on core entities, supporting multipart form data for uploads.
- **State Management**: Frontend uses TanStack Query for server state and URL parameters for maintaining state across multi-step consent flows. The consent wizard uses React state with URL synchronization for persistence and deep linking support.
- **Navigation**: Bottom navigation bar with 5 tabs: Create (home/consent flow), Title IX (information page), Tools (third-party integrations), Contracts (saved documents), and Share. The consent-first architecture makes consent creation immediately accessible at the home route (/).
- **Security**: Implements secure password hashing, session management, and WebAuthn for biometric authentication, ensuring privacy by keeping biometric data on-device.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`
- **Frontend Frameworks/Libraries**: `react`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `zod`, `react-signature-canvas`
- **UI Libraries**: `@radix-ui/*`, `tailwindcss`, `shadcn/ui`, `class-variance-authority`, `cmdk`
- **Backend Frameworks/Libraries**: `express`, `multer`, `tsx`, `esbuild`, `@simplewebauthn/server`, `ws`
- **AI Services**: `OpenAI API` (GPT-4o-mini, GPT-4, GPT-4o)
- **Payment Processing**: `Stripe`
- **Authentication**: `passport`, `express-session`, `@simplewebauthn/browser`