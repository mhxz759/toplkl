# Nuvixpay - Payment Gateway Bot

## Overview

Nuvixpay is a Telegram payment gateway bot with an administrative web dashboard. The system allows users to make deposits and withdrawals through the Telegram bot interface, while administrators can manage users, approve accounts, and track fees through a React-based web panel. The bot integrates with MisticPay for payment processing (PIX and crypto).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend is organized as a single-page application with three main views:
- Dashboard (overview stats and user management)
- Users page (detailed user management)
- Settings page (bot configuration)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Bot Framework**: node-telegram-bot-api for Telegram integration
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation

The server handles both the web API and Telegram bot in a single process. Routes are defined declaratively with type-safe schemas shared between client and server.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts (shared between client/server)

Key tables:
- `users`: Telegram user accounts with balance and approval status
- `transactions`: Deposit/withdrawal records with fees
- `settings`: Key-value store for admin fees balance

### External Integrations
- **Telegram Bot API**: Handles user interactions, deposits, withdrawals
- **MisticPay API**: Payment processing for PIX and crypto transactions

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn/ui based)
│       ├── hooks/        # React Query hooks
│       ├── pages/        # Route pages
│       └── lib/          # Utilities
├── server/           # Express backend + Telegram bot
│   ├── bot.ts        # Telegram bot logic
│   ├── routes.ts     # API endpoints
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code (types, schemas)
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions
└── migrations/       # Database migrations
```

### Key Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:push`: Push schema changes to database

## External Dependencies

### Payment Processing
- **MisticPay API** (`api.misticpay.com`): Handles PIX and cryptocurrency payments. Requires `ci` (client ID) and `cs` (client secret) headers for authentication.

### Telegram Integration
- **Telegram Bot API**: Bot token and admin ID are configured in server/bot.ts. The bot provides deposit/withdrawal functionality and user account management.

### Database
- **PostgreSQL**: Required via DATABASE_URL environment variable. Drizzle ORM manages schema and migrations.

### Key npm Dependencies
- `node-telegram-bot-api`: Telegram bot framework
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `axios`: HTTP client for MisticPay API
- Full shadcn/ui component suite via Radix primitives