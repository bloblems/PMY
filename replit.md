# ConsentGuard - Title IX Consent Documentation App

## Overview

ConsentGuard is a mobile-first web application designed to help document consent in accordance with Title IX requirements. The application provides two primary methods for consent documentation:

1. **Audio Recording**: Allows users to record verbal consent agreements with secure storage
2. **Digital Contracts**: Enables parties to review, sign, and store mutual consent agreements with digital signatures

The application also provides educational information about Title IX consent requirements specific to different universities. Built with a focus on trust, clarity, and legal validity, the design follows Apple's Human Interface Guidelines combined with professional legal-tech application patterns.

## Recent Changes (November 2025)

### University Database Expansion
- Expanded university database from 10 to **300+ top US universities** from uniRank 2025 rankings
- Universities include comprehensive coverage of:
  - All Ivy League schools
  - Top public universities (UC system, state flagships)
  - Leading private universities and technical schools (MIT, Caltech, Georgia Tech)
  - Major state universities across all 50 states
  - Notable liberal arts colleges and service academies
- University data stored in `server/university-data.ts` and seeded automatically on server startup

### Enhanced University Selection
- Added **"My university isn't listed..."** option at the bottom of university selector  
- Option includes explanatory dialog informing users that ConsentGuard is currently available only to top US universities
- Dialog includes mailto link for users to contact support and express interest
- Toast notification confirms interest when dialog is dismissed
- Search functionality allows filtering 300+ universities by name or state

### Title IX Information Management System
- Implemented comprehensive system for maintaining accurate, up-to-date Title IX information
- **Last Updated** dates displayed prominently on Info page with verification status
- **User Reporting**: "Report Issue" button allows users to flag outdated or incorrect information
- **Admin Dashboard** (`/admin`):
  - View and manage pending user reports
  - Update Title IX information and official policy URLs
  - Mark universities as verified after review
  - Track verification status and update history
  - **Note**: Admin endpoints currently have no authentication (acceptable for MVP demo, must add auth before production)
- Database schema includes:
  - `titleIXInfo`, `titleIXUrl`, `lastUpdated`, `verifiedAt` fields on universities table
  - `universityReports` table for tracking user-submitted issues
- API endpoints for reporting, updating, and verifying university information

**Production Recommendations**:
- Add authentication/authorization for all `/api/admin/*` endpoints
- Track resolution metadata (who resolved, when, notes) for audit trail
- Plan integration hooks for automated monitoring to avoid blocking request/response cycle

### AI-Powered Policy Summaries (November 2025)
- **OpenAI Integration**: GPT-4o-mini generates concise 2-3 sentence summaries of Title IX policies
- **Smart Display**: Users see AI summaries by default with "Read More" to expand to full policy
- **Automatic Generation**: Summaries generated on-demand when users view university information
- **Graceful Fallback**: If AI summarization fails, displays full text with user-friendly notification
- **Implementation**:
  - Backend endpoint: `POST /api/summarize-policy`
  - OpenAI API key stored securely in Replit Secrets
  - Temperature 0.3 for consistent, focused summaries
  - Max tokens: 200 for concise output
  - Loading spinner during generation
  - Toggle functionality only appears when summary differs from full text
- **Future Enhancements**:
  - Cache summaries per university to reduce API calls
  - Differentiate rate limit errors (429) from other failures
  - Add telemetry for monitoring summarization success rates

### AI Automation Recommendations for Title IX Monitoring
**Recommended Approach for Production:**
1. **OpenAI/Anthropic Integration**: Use GPT-4 or Claude to periodically review university Title IX pages
   - Set up monthly or quarterly automated checks
   - Compare current policy text with stored versions to detect changes
   - Flag significant changes for admin review
   - Cost: ~$0.01-0.05 per university check

2. **Web Scraping + Change Detection**:
   - Use Playwright or Puppeteer to monitor university Title IX pages
   - Implement hash-based change detection to identify updates
   - Send automated alerts to admin dashboard when changes detected
   - Store snapshots for comparison

3. **Third-Party Services**:
   - Consider services like Apify, Zapier, or Make.com for automated monitoring
   - Set up webhooks to notify admin dashboard of detected changes
   - Integrate with Slack/email for immediate alerts

4. **Manual Review Workflow**:
   - Quarterly admin review of high-priority universities (Ivy League, large state schools)
   - Annual review of all 300+ universities
   - User reports provide crowdsourced accuracy checking

**Implementation Priority**: Start with user reporting + manual admin updates, then layer in automated monitoring as the app scales.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and data fetching

**UI Component System**
- **shadcn/ui** components built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Class Variance Authority (CVA)** for type-safe variant styling
- Design system follows Apple HIG principles with a mobile-first, single-column layout (max-width: 448px)

**Key UI Features**
- Bottom navigation bar for primary app sections (Info, Record, Contract, Files)
- Theme toggle supporting light/dark modes with system preference detection
- Signature capture using `react-signature-canvas` for digital contract signing
- Audio recording interface with media recorder API integration
- Form validation using `react-hook-form` with `zod` schemas
- University selector with search functionality supporting 300+ institutions
- "My university isn't listed" dialog for unsupported institutions

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- Custom middleware for request logging and JSON body parsing
- File upload handling via **Multer** for audio recording uploads

**API Design**
- RESTful API endpoints under `/api/*` prefix
- CRUD operations for universities, recordings, and contracts
- Multipart form data support for audio file uploads

**Data Layer**
- **Drizzle ORM** for type-safe database operations
- Schema-first approach with Zod validation integration
- PostgreSQL database via **Neon serverless** with WebSocket support
- In-memory storage layer (`MemStorage` class) for development/fallback with interface-based abstraction (`IStorage`)
- University data seeded from `server/university-data.ts` (300+ institutions)

**Database Schema**
- `universities`: Institution information with Title IX guidelines
- `consentRecordings`: Audio recording metadata with file URLs and duration
- `consentContracts`: Digital contract text with dual signature fields
- All tables use UUID primary keys with timestamp tracking

### Design System

**Typography & Spacing**
- System font stack (San Francisco on iOS, fallback to -apple-system)
- Structured heading hierarchy (H1-H3) with clear size distinctions
- Tailwind spacing primitives (2, 4, 6, 8, 12, 16) for consistent rhythm
- Mobile-optimized container (max-w-md, 448px) with 24px horizontal padding

**Color System**
- CSS custom properties for theme values (HSL color space)
- Semantic color tokens (primary, secondary, muted, accent, destructive)
- Separate light/dark mode definitions with system preference support
- Border and elevation utilities for depth and hierarchy

**Component Patterns**
- Card-based layouts with consistent borders and shadows
- Hover and active state elevations for interactive feedback
- Accordion components for collapsible information sections
- Toast notifications for user feedback

### External Dependencies

**Core Libraries**
- `@neondatabase/serverless`: PostgreSQL database connectivity with WebSocket support for serverless environments
- `drizzle-orm`: Type-safe ORM for database operations
- `@tanstack/react-query`: Server state management, caching, and synchronization
- `react-signature-canvas`: Canvas-based signature capture for digital contracts
- `multer`: Multipart form data handling for file uploads

**UI Component Libraries**
- `@radix-ui/*`: Comprehensive set of unstyled, accessible UI primitives (accordion, dialog, dropdown, popover, select, toast, etc.)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Type-safe component variant styling
- `cmdk`: Command menu interface component

**Development Tools**
- `@replit/object-storage`: File storage interface (configured for Replit environment)
- `@replit/vite-plugin-*`: Development plugins for Replit integration
- `wouter`: Minimalist router for React (3KB alternative to React Router)
- `nanoid`: Compact unique ID generation

**Type Safety**
- `zod`: Schema validation with TypeScript inference
- `@hookform/resolvers`: Form validation resolver integration

**Build & Runtime**
- `tsx`: TypeScript execution for development server
- `esbuild`: Fast bundling for server-side code
- `ws`: WebSocket library for Neon database connectivity