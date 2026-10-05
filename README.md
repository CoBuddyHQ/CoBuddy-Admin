# CoBuddy Admin Panel

A comprehensive admin dashboard for managing the CoBuddy companion booking platform. This project includes frontend (Next.js) and backend (NestJS) with full integration for core modules.

## 🚀 Tech Stack

### Frontend
- **Next.js 16.3.6** with App Router and Turbopack
- **React 19.2.8**
- **TypeScript**
- **Axios** for API calls
- **Zustand** for state management
- **Tailwind CSS** for styling

### Backend
- **NestJS 10.4.x**
- **TypeScript**
- **Prisma 5.22.0** with PostgreSQL
- **Redis** for caching
- **JWT** for authentication (access/refresh tokens)
- **@nestjs/throttler** for rate limiting
- **Swagger** for API documentation
- **bcrypt** for password hashing
- **otplib** for 2FA

## 📁 Project Structure

```
CoBuddy-Admin/
├── cobuddy-backend/          # NestJS Backend
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── financial/    # Financial management
│   │   │   ├── moderation/    # Content moderation
│   │   │   ├── safety-api/    # Safety operations
│   │   │   ├── verification/  # KYC verification
│   │   │   ├── trust-score/   # Trust scoring system
│   │   │   ├── companions/    # Companion management
│   │   │   ├── customers/     # Customer management
│   │   │   ├── employees/     # Staff management
│   │   │   ├── wallets/       # Wallet & escrow
│   │   │   └── system/        # System configuration
│   │   ├── common/            # Shared utilities
│   │   │   ├── guards/        # Auth & permission guards
│   │   │   ├── decorators/    # Custom decorators
│   │   │   └── dto/           # Common DTOs
│   │   ├── main.ts            # Application entry point
│   │   └── app.module.ts      # Root module
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   └── package.json
├── src/                       # Next.js Frontend
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── moderation/    # Moderation pages
│   │   │   ├── safety/        # Safety pages
│   │   │   ├── financial/     # Financial pages
│   │   │   ├── operations/    # Operations pages
│   │   │   ├── verification/  # Verification pages
│   │   │   ├── support/       # Support pages
│   │   │   ├── system/        # System pages
│   │   │   └── ...
│   │   └── login/             # Login page
│   ├── modules/               # Frontend modules
│   │   ├── moderation/        # Moderation API & hooks
│   │   ├── safety/            # Safety API & hooks
│   │   ├── financial/         # Financial API & hooks
│   │   ├── operations/        # Operations API & hooks
│   │   ├── verification/      # Verification API & hooks
│   │   └── ...
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts      # Axios API client
│   │   └── auth/
│   │       └── permissions.ts # Permission definitions
│   └── components/            # Reusable components
├── .env.local                 # Frontend environment variables
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ (v24.21.0 recommended)
- PostgreSQL database
- Redis server (optional, for caching)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CoBuddy-Admin
```

### 2. Backend Setup

```bash
cd cobuddy-backend

# Install dependencies
npm install

# Set up environment variables (create .env file)
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run db:seed

# Start backend in development mode
npm run start:dev
```

Backend will run on `http://localhost:4000/api`
Swagger documentation available at `http://localhost:4000/swagger`

### 3. Frontend Setup

```bash
cd ..

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local

# Start frontend in development mode
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Authentication

### Admin Credentials
There is no built-in admin password. Development seeding requires a unique
`SEED_DEMO_PASSWORD` of at least 12 characters. Never seed a production database.
For a new production database, use `npm --prefix cobuddy-backend run admin:bootstrap`
with the environment variables described in [DEPLOYMENT.md](DEPLOYMENT.md).

### Seeded Staff Accounts
Development seeding creates these sample staff accounts using `SEED_DEMO_PASSWORD`:

| Role | Email |
|------|-------|
| Super Admin | admin@cobuddy.com |
| Support Lead | supportlead@cobuddy.com |
| Moderator | moderator@cobuddy.com |
| Safety Operator | safety@cobuddy.com |
| Finance Admin | finance@cobuddy.com |
| Legal Admin | legal@cobuddy.com |
| City Ops Manager | cityops@cobuddy.com |
| HR Admin | hr@cobuddy.com |
| Junior Support | juniorsupport@cobuddy.com |

## 📊 Module Integration Status

### ✅ Fully Integrated (Real Backend API)

#### 1. **Authentication & Login**
- Frontend: Real API integration with JWT tokens
- Backend: `/api/auth/login`
- Database: Seeded with 9 staff users
- Features: Login, logout, token refresh, role-based access

#### 2. **Operations & Booking**
- Pages: Live Map, Active Sessions, Completed Bookings, Cancelled Bookings, Matchmaking
- Backend: `/api/operations/*`
- Database: Seeded with sample bookings
- Features: Real-time booking management, location tracking

#### 3. **Verification & Trust**
- Pages: Verification Queue, Companion Applications, Trust Score Engine
- Backend: `/api/verification/*`, `/api/companion-applications/*`, `/api/trust-score/*`
- Database: Seeded with verification cases and companion applications
- Features: KYC verification, trust score calculation, companion onboarding

#### 4. **Moderation**
- Pages: Reports, Bans, Flagged Chats, Chat Settings, Risk Scoring, Reviews, Appeals
- Backend: `/api/moderation/*`
- Database: Seeded with moderation data
- Features: Content moderation, user bans, chat filtering, review moderation

#### 5. **Safety Operations**
- Pages: SOS Dashboard, Geofence Alerts, Incidents, Age Escalations, Emergency Workflow
- Backend: `/api/safety/*`
- Features: Real-time safety monitoring, incident management

#### 6. **Financial Management**
- Pages: Escrow, Payouts, Refunds, Fraud Detection, Reconciliation, Revenue Reports, Tax Invoices
- Backend: `/api/financial/*`
- Features: Payment processing, escrow management, financial reporting

#### 7. **System Configuration**
- Pages: Config, App Configs, Employees
- Backend: `/api/system/*`
- Features: System settings, staff management, application configuration

#### 8. **User Management**
- Pages: Customers, Companions
- Backend: `/api/customers/*`, `/api/companions/*`
- Features: User profiles, status management, trust scores

### ⚠️ Development Mode (Mock Data)

The following modules use mock data in the frontend as backend endpoints are not yet implemented:

#### 9. **Support**
- Pages: Tickets, SLA Dashboard
- Status: Frontend uses mock data
- Backend: Endpoints not implemented

#### 10. **Discovery**
- Pages: Events, Ranking Config, Matchmaking
- Status: Frontend uses mock data (except Matchmaking which uses trust-score rules)
- Backend: Partial implementation

#### 11. **Analytics**
- Pages: Financial, Growth, Operational, Safety Analytics
- Status: Frontend uses mock data
- Backend: Endpoints not implemented

#### 12. **Legal**
- Pages: Data Privacy, Legal Requests
- Status: Frontend uses mock data
- Backend: Endpoints not implemented

#### 13. **Marketing**
- Pages: Notifications, Referrals
- Status: Frontend uses mock data
- Backend: Endpoints not implemented

#### 14. **Platform Config**
- Pages: Policy Docs, Training
- Status: Frontend uses mock data
- Backend: Endpoints not implemented

## 🔒 Role-Based Access Control

The system implements role-based access control with the following roles:

- **SUPER_ADMIN**: Full access to all modules
- **MODERATOR**: Moderation, content review
- **SAFETY_OPERATOR**: Safety operations, incidents, SOS
- **SUPPORT_AGENT/SUPPORT_LEAD**: Customer support, tickets
- **FINANCE_ADMIN**: Financial operations, payouts, refunds
- **LEGAL_ADMIN**: Legal requests, data privacy, age escalations
- **CITY_OPS_MANAGER**: Operations, discovery, events
- **HR_ADMIN**: Employee management

## 🗄️ Database Seeding

The seed script creates comprehensive sample data for development:

### 1. System Defaults
- Cities, areas, interests, languages
- Communication styles, activity paces
- Session durations, notification categories
- Review tags, dispute reasons, cancellation reasons

### 2. Staff Employees
- 9 staff users with different roles
- All use password: `CoBuddy@2026`

### 3. Sample Bookings
- 4 sample bookings with different statuses
- IN_PROGRESS, COMPLETED, CUSTOMER_CANCELLED, ARRIVING

### 4. Verification Cases
- 3 sample verification cases
- Different statuses: PENDING_MANUAL_REVIEW, AUTO_APPROVED, AUTO_REJECTED

### 5. Companion Applications
- 2 sample companion applications
- Statuses: PENDING, IN_REVIEW

### 6. Moderation Data
- 2 sample user reports
- 1 sample ban
- 2 sample reviews

Run seed: `npm run db:seed` (from cobuddy-backend directory)

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Operations
- `GET /api/operations/active-sessions` - Get active sessions
- `GET /api/operations/completed-bookings` - Get completed bookings
- `GET /api/operations/cancelled-bookings` - Get cancelled bookings
- `GET /api/operations/live-map/active-bookings` - Get live map data

### Verification
- `GET /api/verification/cases` - Get verification cases
- `GET /api/verification/thresholds` - Get verification settings
- `GET /api/companion-applications` - Get companion applications
- `GET /api/trust-score/dashboard` - Get trust score dashboard
- `GET /api/trust-score/rules` - Get trust score rules

### Moderation
- `GET /api/moderation/reports` - Get user reports
- `GET /api/moderation/bans` - Get active bans
- `GET /api/moderation/flagged-chats` - Get flagged chats
- `GET /api/moderation/chat-settings` - Get chat settings
- `GET /api/moderation/risk-scores` - Get risk scores
- `GET /api/moderation/reviews` - Get reviews
- `GET /api/moderation/appeals` - Get appeals

### Safety
- `GET /api/safety/sos` - Get SOS alerts
- `GET /api/safety/incidents` - Get incidents
- `GET /api/safety/geofence/alerts` - Get geofence alerts
- `GET /api/safety/age-escalations` - Get age escalations
- `GET /api/safety/emergency-workflows` - Get emergency workflows

### Financial
- `GET /api/financial/escrow` - Get escrow records
- `GET /api/financial/payouts` - Get payouts
- `GET /api/financial/refunds` - Get refund requests
- `GET /api/financial/fraud-detection` - Get fraud alerts
- `GET /api/financial/reconciliation` - Get reconciliation records
- `GET /api/financial/revenue-reports/*` - Get revenue reports
- `GET /api/financial/tax-invoices` - Get tax invoices

### System
- `GET /api/system/config` - Get system config
- `GET /api/system/app-configs` - Get app configs
- `GET /api/system/employees` - Get employees

### Users
- `GET /api/customers` - Get customers
- `GET /api/companions` - Get companions

Full API documentation available at `http://localhost:4000/swagger`

## 🔧 Troubleshooting

### Port Already in Use
If you get `EADDRINUSE` error for port 4000 or 3000:

```bash
# Find and kill process on port 4000
netstat -ano | findstr :4000
taskkill //PID <PID> //F

# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill //PID <PID> //F
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend .env file
- Run `npx prisma migrate dev` to create tables
- Run `npm run db:seed` to populate sample data

### 429 Too Many Requests
The backend has rate limiting enabled. In development mode, throttling is disabled to prevent repeated 429 errors.

### Validation Errors
If you see `property should not exist` errors, the backend uses strict validation. In development mode, non-whitelisted properties are allowed for easier debugging.

## 📝 Development Notes

### Backend Development
- Backend uses NestJS with modular architecture
- Each feature is a separate module (financial, moderation, safety, etc.)
- All controllers use `@AllowModule()` decorator for permission checking
- Mutations use `@AuditLog()` decorator for audit trails
- Role restrictions use `@Roles()` decorator

### Frontend Development
- Frontend uses Next.js 16 with App Router
- Each module has its own API client, hooks, and types
- API calls use the centralized Axios client in `src/lib/api/client.ts`
- State management uses Zustand with persistence
- All API clients follow the pattern: `response.data.data?.data ?? response.data.data ?? []`

### Adding New Modules
1. Create backend module in `cobuddy-backend/src/modules/`
2. Add controller with `@AllowModule()` decorator
3. Add module permission to `permissions.guard.ts`
4. Create frontend module in `src/modules/`
5. Create API client using Axios
6. Create React hooks for data fetching
7. Create page in `src/app/(dashboard)/`

## 🚀 Deployment

### Backend
```bash
cd cobuddy-backend
npm run build
npm run start:dev
```

### Frontend
```bash
npm run build
npm run start
```

## 📄 License

Proprietary - CoBuddy Platform

## 👥 Support

For issues or questions, contact the development team.

---

**Last Updated**: September 28, 2026
**Version**: 0.1.0
