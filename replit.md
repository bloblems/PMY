# ConsentGuard - Title IX Consent Documentation App

## Overview

ConsentGuard is a mobile-first web application designed to help document consent in accordance with Title IX requirements. The application provides two primary methods for consent documentation:

1. **Audio Recording**: Allows users to record verbal consent agreements with secure storage
2. **Digital Contracts**: Enables parties to review, sign, and store mutual consent agreements with digital signatures

The application also provides educational information about Title IX consent requirements specific to different universities. Built with a focus on trust, clarity, and legal validity, the design follows Apple's Human Interface Guidelines combined with professional legal-tech application patterns.

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