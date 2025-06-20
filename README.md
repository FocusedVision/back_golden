# Golden SaaS Backend

A Node.js backend API built with **TypeScript**, Express, PostgreSQL, and Prisma for the Golden SaaS application.

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting, password hashing
- **Validation**: Input validation with express-validator
- **Controllers**: Organized controller pattern with proper typing
- **Centralized Routing**: All routes managed in one file
- **Error Handling**: Comprehensive error handling middleware
- **Logging**: Morgan for request logging

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
back/
├── src/
│   ├── controllers/         # Business logic controllers
│   │   ├── authController.ts
│   │   └── userController.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts
│   │   ├── adminAuth.ts
│   │   └── superAdminAuth.ts
│   ├── config/             # Configuration files
│   │   └── database.ts
│   ├── routes/             # Route definitions
│   │   └── index.ts        # All routes in one file
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   └── express.d.ts
│   └── server.ts           # Main server file
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seeding
├── dist/                   # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json          # TypeScript configuration
├── .env.example
└── .gitignore
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd back
npm install
```

### 2. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/golden_saas_db?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 4. Development

For development with TypeScript:

```bash
# Start development server with hot reload
npm run dev

# Or compile TypeScript and watch for changes
npm run dev:build
```

### 5. Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server with tsx watch
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Type check without emitting files
- `npm run clean` - Remove dist folder
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset the database

## TypeScript Features

- **Strict Type Checking**: Full type safety with strict TypeScript configuration
- **Interface Definitions**: Comprehensive type definitions for all API requests/responses
- **Path Mapping**: Convenient import paths using @ aliases
- **Express Type Extensions**: Custom Request interface extensions
- **Enum Types**: Type-safe user roles and other constants
- **Generic Types**: Reusable generic interfaces for API responses

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### User Management Routes (Admin)
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/toggle-status` - Toggle user active status
- `DELETE /api/users/:id` - Delete user (Super Admin only)
- `GET /api/users/stats/overview` - Get user statistics

### Dashboard Routes
- `GET /api/dashboard/overview` - Get dashboard overview

### Other Routes
- `GET /api/health` - Health check
- `GET /api/plans` - Get available subscription plans
- `GET /api/subscriptions/current` - Get current subscription

## Default Users

After running the seed script, these users will be available:

- **Super Admin**: `admin@goldensaas.com` / `SuperAdmin123!`
- **Admin**: `moderator@goldensaas.com` / `Admin123!`
- **User**: `user@example.com` / `User123!`

## API Response Format

All API responses follow this TypeScript interface:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}
```

## Type Definitions

Key TypeScript interfaces:

```typescript
// User roles
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Extended Request interface
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// User without password
interface SafeUser extends Omit<User, 'password'> {}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication with TypeScript types
- **Password Hashing**: bcryptjs with salt rounds
- **Role-based Access Control**: Type-safe USER, ADMIN, SUPER_ADMIN roles
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive input validation with TypeScript
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet for security headers

## Development with TypeScript

The project is fully configured for TypeScript development:

- Strict type checking enabled
- Path mapping for clean imports
- Hot reload with tsx
- Source maps for debugging
- Declaration files generation

```bash
# Type check your code
npm run type-check

# Development with hot reload
npm run dev
```

## License

ISC