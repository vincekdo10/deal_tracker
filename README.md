# Deal Tracker

A comprehensive deal management application built with Next.js 15, TypeScript, and Snowflake. This application provides a modern, secure, and scalable solution for managing sales deals, teams, tasks, and analytics.

## 🚀 Features

### Core Functionality
- **Deal Management**: Create, update, and track sales deals with comprehensive details
- **Team Management**: Organize users into teams with role-based access control
- **Task Management**: Kanban-style task management with subtasks and assignments
- **User Management**: Secure user authentication with role-based permissions
- **Analytics Dashboard**: Real-time insights and metrics for deal performance

### User Roles
- **Admin**: Full system access, user management, and analytics
- **Solutions Architect**: Deal creation, team collaboration, and technical oversight
- **Sales Director**: Deal ownership, task management, and team coordination

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API rate limiting for security
- **Password Security**: Strong password requirements and temporary password system
- **Role-Based Access Control**: Granular permissions based on user roles

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation
- **React Beautiful DnD**: Drag and drop functionality

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Snowflake**: Cloud data warehouse
- **bcryptjs**: Password hashing
- **JWT**: JSON Web Token authentication

### Development Tools
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Snowflake account with appropriate permissions
- Environment variables configured (see Environment Setup)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd deal_tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=DEAL_TRACKER
SNOWFLAKE_SCHEMA=CONTAINER_APP
SNOWFLAKE_ROLE=TRANSFORMER

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Application Configuration
NEXT_PUBLIC_APP_NAME=Deal Tracker
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Initialization
The application will automatically create the required Snowflake tables on first run. Ensure your Snowflake user has the necessary permissions to create tables in the specified schema.

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin management endpoints
│   │   ├── deals/         # Deal management endpoints
│   │   ├── tasks/         # Task management endpoints
│   │   └── teams/         # Team management endpoints
│   ├── admin/             # Admin pages
│   ├── dashboard/         # Dashboard pages
│   ├── deals/             # Deal management pages
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── kanban/            # Kanban board components
│   ├── layout/            # Layout components
│   ├── modals/            # Modal components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── snowflake-server.ts # Snowflake service
│   ├── api-client.ts      # API client utilities
│   └── utils.ts           # General utilities
├── services/              # Business logic services
│   └── database.ts        # Database service layer
├── types/                 # TypeScript type definitions
│   └── index.ts           # Main type definitions
└── middleware.ts          # Next.js middleware
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database
npm run db:init      # Initialize database tables
npm run db:reset     # Reset database (development only)
```

## 🗄️ Database Schema

The application uses Snowflake with the following main tables:

- **users**: User accounts and authentication
- **teams**: Team definitions and metadata
- **user_teams**: Many-to-many relationship between users and teams
- **deals**: Sales deals and opportunities
- **tasks**: Deal-related tasks and activities
- **subtasks**: Task breakdown and details
- **activity_logs**: System activity and audit trail

## 🔐 Security

### Authentication
- JWT-based authentication with HTTP-only cookies
- Password hashing using bcrypt with 12 rounds
- Temporary password system for new users
- Forced password change on first login

### API Security
- CSRF token validation
- Rate limiting (60 requests per minute per IP)
- Request validation and sanitization
- Origin and User-Agent validation

### Data Protection
- Graceful user deletion with data reassignment
- Soft delete options for data preservation
- Comprehensive audit logging
- Role-based access control

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in your production environment:

```env
SNOWFLAKE_ACCOUNT=your_production_account
SNOWFLAKE_USERNAME=your_production_username
SNOWFLAKE_PASSWORD=your_production_password
SNOWFLAKE_WAREHOUSE=your_production_warehouse
SNOWFLAKE_DATABASE=DEAL_TRACKER
SNOWFLAKE_SCHEMA=CONTAINER_APP
SNOWFLAKE_ROLE=TRANSFORMER
JWT_SECRET=your_production_jwt_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Build and Deploy
```bash
npm run build
npm run start
```

### Database Setup
The application will automatically create required tables on first startup. Ensure your Snowflake user has appropriate permissions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common issues

## 🔄 Version History

- **v1.0.0**: Initial release with core deal management functionality
- **v1.1.0**: Added team management and user roles
- **v1.2.0**: Implemented task management with Kanban board
- **v1.3.0**: Added analytics dashboard and reporting
- **v1.4.0**: Enhanced security and user management features

---

Built with ❤️ using Next.js, TypeScript, and Snowflake