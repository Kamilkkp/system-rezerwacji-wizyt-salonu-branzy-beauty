# Business Panel - Frontend

A comprehensive Content Management System for beauty salons with advanced booking and business management features.

## Features

- **Authentication System** - Secure login with JWT tokens and refresh mechanism
- **Salon Management** - Create, edit, and manage multiple salon locations
- **Service Groups** - Organize services into logical categories
- **Services Management** - Add, edit, and manage individual services with pricing
- **Promotions** - Create and manage promotional offers and discounts
- **Reservations** - View, manage, and create appointment bookings
- **Calendar View** - Visual calendar interface for reservation management
- **Account Management** - User profile and settings management
- **Mailing System** - Email notifications campaigns
- **Open Hours Exceptions** - Manage special opening hours and holidays

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Static typing for better development experience
- **Material-UI (MUI)** - Professional UI component library
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **Axios** - HTTP client for API communication
- **date-fns** - Date manipulation and formatting
- **React Big Calendar** - Calendar component for reservations
- **React Hot Toast** - User notifications
- **Emotion** - CSS-in-JS styling solution

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm installed on your machine
- Backend API running (see backend README for setup instructions)

### Initial Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Create or update `env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000

   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   
   Open [http://localhost:3002](http://localhost:3002) in your browser.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` (local) or `https://your-api-domain.com` (production) |

## Production Deployment

### Vercel Deployment

**Quick Deployment:**
1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` - Backend API URL

## API Endpoints

The Business panel communicates with the backend through the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Account Management
- `GET /bms/account` - Get user account details
- `PATCH /bms/account` - Update account information
- `DELETE /bms/account` - Delete account

### Salon Management
- `GET /bms/salons` - Get all salons
- `POST /bms/salons` - Create new salon
- `GET /bms/salons/{id}` - Get salon details
- `PATCH /bms/salons/{id}` - Update salon
- `DELETE /bms/salons/{id}` - Delete salon

### Service Groups
- `GET /bms/salons/{salonId}/service-groups` - Get service groups
- `POST /bms/salons/{salonId}/service-groups` - Create service group
- `GET /bms/salons/{salonId}/service-groups/{id}` - Get service group details
- `PATCH /bms/salons/{salonId}/service-groups/{id}` - Update service group
- `DELETE /bms/salons/{salonId}/service-groups/{id}` - Delete service group

### Services
- `GET /bms/salons/{salonId}/service-groups/{serviceGroupId}/services` - Get services
- `POST /bms/salons/{salonId}/service-groups/{serviceGroupId}/services` - Create service
- `PATCH /bms/salons/{salonId}/service-groups/{serviceGroupId}/services/{id}` - Update service
- `DELETE /bms/salons/{salonId}/service-groups/{serviceGroupId}/services/{id}` - Delete service

### Promotions
- `GET /bms/salons/{salonId}/promotions` - Get promotions
- `POST /bms/salons/{salonId}/promotions` - Create promotion
- `GET /bms/salons/{salonId}/promotions/{id}` - Get promotion details
- `PATCH /bms/salons/{salonId}/promotions/{id}` - Update promotion
- `DELETE /bms/salons/{salonId}/promotions/{id}` - Delete promotion

### Reservations
- `GET /bms/salons/{salonId}/reservations` - Get all reservations
- `GET /bms/salons/{salonId}/reservations/{id}` - Get reservation details
- `POST /bms/salons/{salonId}/reservations` - Create reservation
- `POST /bms/salons/{salonId}/reservations/{id}/confirm` - Confirm reservation
- `POST /bms/salons/{salonId}/reservations/{id}/complete` - Complete reservation
- `POST /bms/salons/{salonId}/reservations/{id}/cancel` - Cancel reservation

### Mailing System
- `POST /bms/salons/{salonId}/mailing-system/send` - Send email messages
- `GET /bms/salons/{salonId}/mailing-system/history` - Get email history

### Open Hours Exceptions
- `GET /bms/salons/{salonId}/open-hours-exceptions` - Get exceptions
- `POST /bms/salons/{salonId}/open-hours-exceptions` - Create exception
- `PATCH /bms/salons/{salonId}/open-hours-exceptions/{id}` - Update exception
- `DELETE /bms/salons/{salonId}/open-hours-exceptions/{id}` - Delete exception

## Project Structure

```
business-panel/
├── app/                    # App Router (Next.js 15)
│   ├── auth/              # Authentication pages
│   │   └── login/         # Login page
│   ├── bms/               # bms pages
│   │   ├── account/       # Account management
│   │   ├── promotions/    # Promotions management
│   │   ├── reservations/  # Reservation management
│   │   ├── salons/        # Salon management
│   │   ├── service-groups/ # Service groups management
│   │   ├── mailing-system/ # Email system
│   │   ├── open-hours-exceptions/ # Opening hours exceptions
│   │   └── layout.tsx     # bms layout with navigation
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── middleware.ts      # Authentication middleware
│   └── page.tsx           # Redirect logic (to reservations or login)
├── components/            # React components
│   └── ThemeRegistry.tsx  # MUI theme provider
├── context/               # React contexts
│   ├── AuthContext.tsx    # Authentication context
│   └── SalonContext.tsx   # Salon selection context
├── lib/                   # Libraries and configuration
│   └── api.ts            # API configuration and types
├── types/                 # TypeScript type definitions
│   └── index.ts          # API types
├── env.local              # Environment variables
└── package.json          # Project dependencies
```

## Business Panel Features

### Authentication & Security
1. **Login system** - Secure authentication with JWT tokens
2. **Token refresh** - Automatic token renewal
3. **Protected routes** - Middleware-based route protection
4. **Session management** - Persistent login state

### Salon Management
1. **Multi-salon support** - Manage multiple salon locations
2. **Salon details** - Contact information, address, opening hours
3. **Salon switching** - Easy switching between different salons

### Service Management
1. **Service groups** - Organize services into categories
2. **Service details** - Pricing, duration, description
3. **Service hierarchy** - Groups → Services structure

### Reservation System
1. **Calendar view** - Visual calendar interface
2. **Reservation management** - Create, edit, cancel reservations
3. **Status tracking** - Confirm, complete, cancel reservations
4. **Time slot management** - Available slots and booking

### Promotions & Marketing
1. **Promotion creation** - Percentage or fixed amount discounts
2. **Targeted promotions** - Apply to specific services or groups
3. **Time-limited offers** - Set start and end dates
4. **Email marketing** - Send promotional emails to customers

### Business Tools
1. **Account management** - User profile and settings
2. **Opening hours exceptions** - Special hours and holidays
3. **Email system** - Customer communication tools

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```
