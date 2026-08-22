# Kai Gaming

A full-stack PS5 gaming cafe booking platform for "Kai Gaming" in Ambernath. Features online booking with live station status, admin panel with Google authentication, Discord notifications, and a neobrutalist design system.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for development and builds
- **Tailwind CSS v3** with custom neobrutalist design tokens
- **React Router v7** for navigation
- **Firebase** (Firestore + Auth + Functions) for backend
- **Lucide React** for icons
- **Oxlint** for linting

## Features

- Online booking with time-slot selection
- Live station status (open/closed/full)
- Admin panel with Google authentication (Calendar, Stations, Bookings, Discord, Settings tabs)
- Discord webhook notifications on new bookings
- Pricing page with tier comparison
- Gallery with circular carousel
- About page with team info
- Contact page with form
- Privacy policy and 404 pages
- Neobrutalist dark design system
- Scroll-reveal animations with custom hooks
- Responsive layout

## Getting Started

```bash
npm install
cp .env.example .env   # Fill in Firebase credentials and Discord webhook URL
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Firebase Functions

```bash
cd functions && npm run build
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (AuthContext)
├── data/             # Content data files
├── firebase/         # Firebase config and abstractions
├── hooks/            # Custom hooks (useInView, useTilt, useCounter, useSettings)
├── pages/            # Route pages (Home, Book, Pricing, Gallery, Admin, etc.)
└── index.css         # Global styles and neobrutalist utilities
functions/
└── src/index.ts      # Firebase Functions (Discord notification on booking)
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

Deployed on Vercel. Push to `master` to trigger automatic deployments.
