# Overview

This is a full-stack place discovery application called "FinD-ora" that allows users to search for nearby places using location-based services. The application combines React frontend with Express backend, featuring user authentication, Google Places API integration, AI-powered place categorization, and interactive mapping capabilities. Users can register, login, search for places by location and radius, apply filters, view results on an interactive map, and maintain search history.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Mapping**: Leaflet for interactive maps with OpenStreetMap tiles
- **Form Handling**: React Hook Form with Zod validation
- **Build System**: Vite with ESM modules and hot reload support

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON communication
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Structure**: Monorepo structure with shared schema between client and server
- **Development Setup**: Includes Replit-specific plugins for development environment

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for schema management and queries
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Local Development**: File-based storage using JSON files for user data and search history
- **Session Management**: JWT tokens stored in localStorage on client side
- **Caching**: In-memory caching for places data and API responses

## Authentication and Authorization
- **Registration/Login**: Email/password authentication with bcrypt hashing
- **Session Management**: JWT tokens with 7-day expiration
- **Route Protection**: Middleware-based authentication for protected endpoints
- **Client Storage**: JWT tokens and user data stored in browser localStorage
- **Password Security**: Bcrypt with salt rounds for secure password hashing

## External Dependencies

### Third-party APIs
- **Google Places API**: Core place search functionality, nearby search, and place details
- **OpenRouter API**: AI-powered place categorization using Claude 3 Haiku model
- **OpenCage Geocoding**: Reverse geocoding for address resolution
- **OpenStreetMap**: Map tiles for the interactive mapping interface

### Key Libraries and Services
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: Drizzle for type-safe database operations and migrations
- **UI Components**: Extensive Radix UI component library for accessible interface elements
- **Mapping**: Leaflet for interactive maps with marker support
- **Validation**: Zod for runtime type checking and validation
- **Styling**: Tailwind CSS with custom design system variables
- **Development**: Replit-specific tooling for cloud development environment

### Infrastructure
- **Build Pipeline**: Vite for frontend bundling, esbuild for backend compilation
- **Development Server**: Express with Vite middleware for development
- **Environment**: Designed for Replit cloud development platform
- **File Storage**: Local JSON file system for development, with PostgreSQL for production