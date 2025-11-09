# ConsentGuard - Title IX Consent Documentation App

## Overview
ConsentGuard is a mobile-first web application designed to document consent in accordance with Title IX requirements. It offers audio recording for verbal agreements and digital contracts for signed consent. The application also provides educational information about Title IX consent requirements, customized by university. Built with a focus on trust, clarity, and legal validity, ConsentGuard aims to provide a secure and legally sound platform for consent documentation, adhering to Apple's Human Interface Guidelines and professional legal-tech patterns. The project's ambition is to become a leading solution for Title IX compliance and consent education within academic institutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React 18 with TypeScript, Vite for tooling, Wouter for routing, TanStack Query for server state.
- **UI Components**: shadcn/ui built on Radix UI, Tailwind CSS for styling with custom design tokens, Class Variance Authority for type-safe variants.
- **Design**: Apple HIG principles, mobile-first, single-column layout (max-width: 448px), light/dark mode.
- **Key Features**: Bottom navigation, signature capture (`react-signature-canvas`), audio recording (Media Recorder API), form validation (`react-hook-form` with `zod`), university selector with search and "My university isn't listed" option.

### Backend Architecture
- **Server**: Express.js with TypeScript on Node.js, Multer for file uploads.
- **API**: RESTful endpoints (`/api/*`) for CRUD operations on universities, recordings, and contracts, supporting multipart form data.
- **Data Layer**: Drizzle ORM for type-safe PostgreSQL operations via Neon serverless. Uses a `DbStorage` class with an `IStorage` interface.
- **Database Seeding**: Automatically seeds 287 top US universities (including 16 manually verified with comprehensive Title IX info) from `server/university-data.ts` on startup if tables are empty.
- **Database Schema**: `universities` (Title IX info, verification status, `lastUpdated`), `consentRecordings`, `consentContracts`, `universityReports` (for user-submitted issues).
- **Title IX Management**: Comprehensive system for managing university Title IX information, including user reporting, admin dashboard for updates and verification, and API endpoints for reporting, updating, and verifying.
- **AI Integration**: OpenAI GPT-4o-mini generates 150-200 word summaries of Title IX policies for 271 universities, with smart display and graceful fallback. Summaries are professional and cover key aspects like prohibited conduct, consent requirements, reporting procedures, and support resources.

### Design System
- **Typography**: System font stack, structured heading hierarchy, Tailwind spacing.
- **Color**: CSS custom properties with HSL, semantic tokens, light/dark mode support.
- **Components**: Card-based layouts, hover/active state elevations, accordions, toast notifications.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: PostgreSQL connectivity for serverless.
- `drizzle-orm`: Type-safe ORM.
- `@tanstack/react-query`: Server state management.
- `react-signature-canvas`: Digital signature capture.
- `multer`: File uploads.
- `tsx`: TypeScript execution for development.
- `esbuild`: Fast server-side bundling.
- `ws`: WebSocket library for Neon.

### UI Component Libraries
- `@radix-ui/*`: Accessible UI primitives.
- `tailwindcss`: Utility-first CSS.
- `class-variance-authority`: Type-safe variant styling.
- `cmdk`: Command menu component.

### Development & Type Safety
- `@replit/object-storage`: Replit file storage interface.
- `@replit/vite-plugin-*`: Replit Vite plugins.
- `wouter`: Minimalist React router.
- `nanoid`: Compact unique ID generation.
- `zod`: Schema validation.
- `@hookform/resolvers`: Form validation resolver.

### AI/External Services
- **OpenAI API**: For AI-powered Title IX policy summarization using GPT-4o-mini and verification using GPT-4/GPT-4o.
- **Stripe**: Payment processing for user-paid verification services.

## Recent Features

### User Authentication System (November 2025) 🎯 NEW
**Feature**: Secure user accounts to track consent documents and verification purchases

**Implementation**:
- **Database Schema**: `users` table with email, name, profile picture, password hash/salt, timestamps
- **Password Security**: PBKDF2 hashing with 10,000 iterations and 64-byte SHA-512 salts stored in database
- **Session Management**: Express-session with secure HTTP-only cookies (7-day expiration)
- **Passport.js Integration**: Local strategy for email/password authentication
- **User Tracking**: Foreign key `userId` fields added to `consentRecordings`, `consentContracts`, and `verificationPayments` tables
- **API Endpoints**:
  - `POST /api/auth/signup` - User registration with email validation
  - `POST /api/auth/login` - User login with credential verification
  - `POST /api/auth/logout` - User logout and session destruction
  - `GET /api/auth/me` - Get current user information
- **Security**: SESSION_SECRET environment variable required in production (fails fast if missing)

**Technical Details**:
- Backend: `server/auth.ts` with Passport strategies, `server/storage.ts` with user CRUD methods
- Authentication middleware: `isAuthenticated` function to protect routes
- Database persistence: Password hashes stored securely, survives server restarts

**Status**: Backend complete, frontend UI (login/signup forms, user dashboard) pending

### UI Redesign: Consent Flow Centerpiece (November 2025) 🎯 NEW
**Feature**: Streamlined UI with prominent "Press for Yes" consent button

**Changes**:
- **Centerpiece Button**: Red "Press for Yes" card positioned between university selector and Title IX info panel
  - Bold red background (red-600 in light mode, red-700 in dark mode)
  - Centered text with clear call-to-action
  - Interactive hover and active states
  - Mobile-optimized design
- **Navigation Simplification**: Removed bottom navigation bar (Record/Contract/Files buttons)
  - Streamlines user experience to focus on consent documentation flow
  - Reduces UI clutter on mobile devices
  - Main content no longer needs bottom padding

**Technical Details**:
- Location: `client/src/pages/InfoPage.tsx` - card component between UniversitySelector and TitleIXInfo
- Removed: `BottomNav` component from `client/src/App.tsx`
- Test ID: `data-testid="button-press-for-yes"` for automated testing

**Future**: Button will navigate to consent flow UX when clicked

### User-Paid Verification System (November 2025)
**Feature**: Users can pay to verify Title IX policies using AI-powered analysis

**Implementation**:
- **Stripe Integration**: Secure payment processing for verification services  
- **Three AI Model Tiers**:
  - GPT-4: $5.00 - Most accurate, comprehensive analysis
  - GPT-4 Turbo: $3.00 - Fast and thorough verification
  - GPT-4o: $2.00 - Optimized for accuracy and speed (recommended)
- **Verification Process**:
  1. User selects university and AI model tier
  2. Stripe checkout session created
  3. Payment processed securely through Stripe
  4. AI analyzes stored policy against official sources
  5. If verified with high confidence, university gets verified badge
  6. User receives detailed verification report
- **Database Tracking**: `verificationPayments` table tracks all payments, verification status, and results
- **Revenue Model**: Platform profits from verification fees as users pay to earn verified badges for their universities
- **Auto-verification**: Successful verifications automatically mark university as verified

**Technical Details**:
- Frontend: Verification dialog in `TitleIXInfo.tsx` with pricing tiers and Stripe redirect
- Backend: Stripe SDK, checkout session creation, webhook handling
- API Endpoints:
  - `POST /api/verify/create-checkout` - Create Stripe checkout session
  - `POST /api/verify/webhook` - Handle Stripe payment confirmations
  - `GET /api/verify/status/:sessionId` - Check verification progress
- AI Analysis: GPT-4/GPT-4o analyzes policy text for accuracy, completeness, and professionalism
- Async Processing: Verification runs in background after payment confirmation

**Future Enhancements**:
- Web scraping to compare with live university Title IX pages
- Email notifications when verification completes
- Verification history for users
- Admin dashboard for verification analytics