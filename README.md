# Kai Gaming

A PS5 gaming cafe website and booking-request app for Kai Gaming in Ambernath. Customers can request a station, date, time, and game; requests stay pending until an admin confirms them.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for development and builds
- **Tailwind CSS v3** with custom neobrutalist design tokens
- **React Router v7** for navigation
- **Firebase** (Firestore + Auth + Functions) for backend
- **Lucide React** for icons
- **Oxlint** for linting

## Features

- Booking requests with date, time-slot, station, game, and customer details
- Public station status and an admin panel with Google authentication (Calendar, Stations, Bookings, Discord, Settings)
- Discord notifications when a booking request is created (optional webhook)
- Pricing, about, contact, and privacy pages
- Responsive neobrutalist dark design system

## Getting Started

Use Node.js 20.19+ (or 22.12+) and npm.

### 1. Configure Firebase

Create a Firebase project and register a web app in the Firebase console. Enable **Cloud Firestore** and **Google** under Authentication > Sign-in method. Add `localhost` and your deployed site's domain under Authentication > Settings > Authorized domains.

Copy the web app configuration into a local `.env` file:

```powershell
Copy-Item .env.example .env
```

Set the six `VITE_FIREBASE_*` values from the Firebase web app configuration in `.env`. Deploy the included Firestore rules and indexes with the Firebase CLI:

```bash
npm install --global firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

Only the admin emails listed in `src/contexts/AuthContext.tsx` and `firestore.rules` can manage stations, bookings, and settings. Add or remove admins in both places together.

### 2. Install and run

```bash
npm install
npm run dev
```

Without Firebase settings the marketing pages can still be previewed, but the app will show a setup notice and booking submissions/admin sign-in will be unavailable. `VITE_DISCORD_WEBHOOK_URL` is optional for browser notifications. If you deploy the Firebase Function, its optional `DISCORD_WEBHOOK_URL` parameter enables server-side notifications; do not configure both to the same webhook or each booking may notify twice. Notification delivery never confirms a booking—admins confirm requests in the panel.

### 3. Validate or preview a production build

```bash
npm run lint
npm run build
npm run preview
```

## Optional Firebase Function

```bash
npm --prefix functions install
npm --prefix functions run build
firebase deploy --only functions
```

The function sends booking notifications when `DISCORD_WEBHOOK_URL` is configured. If no webhook is supplied, booking requests are still stored and remain pending for admin review.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (AuthContext)
├── firebase/         # Firebase config and abstractions
├── hooks/            # Custom hooks (useInView, useTilt, useCounter, useSettings)
├── pages/            # Route pages (Home, About, Booking, Pricing, Contact, Admin, etc.)
└── index.css         # Global styles and neobrutalist utilities
functions/
└── src/index.ts      # Firestore-triggered Discord notification
```

## Design System

Neobrutalist style with custom tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `kai-dark` | `#1A1E24` | Page background |
| `kai-deeper` | `#14171C` | Navbar/admin header |
| `kai-surface` | `#22272F` | Cards |
| `kai-ink` | `#0C0E12` | Borders/shadows |
| `kai-red` | `#C0392B` | Accent/CTA |

## Deployment

The site can be deployed to Vercel. Configure the `VITE_FIREBASE_*` values in the deployment environment before building; they are embedded into the client bundle at build time.
