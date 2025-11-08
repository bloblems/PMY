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
- **OpenAI API**: For AI-powered Title IX policy summarization using GPT-4o-mini.