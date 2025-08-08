# Salon Website - Frontend

A beauty salon website with online appointment booking functionality.

## Features

- **Homepage** - salon presentation with service information
- **Services list** - catalog of all service groups
- **Service details** - detailed service information with booking capability
- **Booking system** - time slot selection and reservation form
- **Reservation confirmation** - page with reservation details and cancellation option
- **About page** - salon and team information
- **Contact page** - contact form and contact information

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - static typing
- **Tailwind CSS** - CSS framework
- **React Hook Form** - form management
- **Zod** - schema validation
- **Axios** - API communication
- **date-fns** - date handling
- **Lucide React** - icons
- **React Hot Toast** - notifications

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm installed on your machine
- Backend API running (see backend README for setup instructions)

### Initial Setup

1. **Create salon in backend first**
   
   Before setting up the frontend, you need to create a salon in the backend system.
   
   **Copy the salon ID**  - you'll need it for the frontend configuration.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create or update `env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_SALON_ID=your-salon-id-from-backend
   ```
   
   **Important:** Replace `your-salon-id-from-backend` with the actual salon ID you copied from step 1.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open [http://localhost:3001](http://localhost:3001) in your browser.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` (local) or `https://your-api-domain.com` (production) |
| `NEXT_PUBLIC_SALON_ID` | Salon ID from backend | `6cd740cd-1da9-4c4d-8f26-9519ce63c521` (example) |

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
   - `NEXT_PUBLIC_SALON_ID` - Salon ID



## API Endpoints

The application communicates with the backend through the following endpoints:

- `GET /public/salons/{salonId}` - get salon data
- `GET /public/salons/{salonId}/service-groups` - list service groups
- `GET /public/salons/{salonId}/service-groups/{id}` - service group details
- `GET /public/salons/{salonId}/reservations/available-slots` - available time slots
- `POST /public/salons/{salonId}/reservations` - create reservation
- `GET /public/salons/{salonId}/reservations/{id}` - reservation details
- `POST /public/salons/{salonId}/reservations/{id}/cancel` - cancel reservation

## Project Structure

```
salon-website/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── page.tsx           # Homepage
│   │   ├── services/          # Service pages
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact page
│   │   └── reservation/       # Reservation pages
│   ├── components/            # React components
│   │   ├── Header.tsx         # Page header
│   │   ├── Footer.tsx         # Page footer
│   │   ├── ServiceCard.tsx    # Service card
│   │   ├── TimeSlotPicker.tsx # Time slot picker
│   │   └── BookingForm.tsx    # Booking form
│   └── lib/                   # Libraries and configuration
│       └── api.ts            # API configuration and types
├── env.local                  # Environment variables
└── package.json              # Project dependencies
```

## Booking System Features

1. **Service selection** - user selects a service from the list
2. **Time slot selection** - calendar with available time slots
3. **Booking form** - contact information and consent
4. **Confirmation** - page with reservation details
5. **Cancellation** - ability to cancel reservation


