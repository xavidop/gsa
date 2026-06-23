# Global Slab Authority (GSA)

A modern trading card grading and collection management platform powered by AI. GSA lets collectors upload card images, receive AI-generated grades, manage their collections, and connect with a community of fellow collectors.

## Features

- **AI-Powered Card Grading** — Automatically analyze card images using Gemini Pro Vision via Genkit. Grades include centering, corners, edges, and surface subgrades with an overall score.
- **Digital Slab** — Animated digital slab display for each graded card with grade, subgrades, and GSA branding.
- **QR Code Sharing** — Generate QR codes linking to a public, shareable grading page for any card.
- **Collection Management** — Organize graded cards into collections and track detailed metadata.
- **Portfolio Analytics** — Track total collection value, ROI, and price trends based on market data.
- **Price Alerts** — Set notifications for when cards reach a target price.
- **Trading System** — Propose and negotiate card trades with other collectors, including automatic fairness scoring.
- **Leaderboards** — Compete across categories: collection value, card count, average grade, and trading volume.
- **Achievements & Gamification** — Unlock achievements across grading, collecting, value, social, and trading milestones with rarity tiers (Common → Legendary).
- **Social Feed** — Follow other collectors, view activity feeds, and share card highlights.
- **Discover** — Browse and search the public card catalog.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui (Radix UI) |
| AI | Genkit 1.x, Google Gemini Pro Vision |
| Backend/DB | Firebase (Auth, Firestore, Storage) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Export | jsPDF, html2canvas |
| Deployment | Firebase App Hosting / Google Cloud Run |

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Auth, Firestore, and Storage enabled
- Google Gemini API key

### Installation

```bash
git clone <repo-url>
cd gsa
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Firebase client config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Gemini AI
GEMINI_API_KEY=
```

### Development

```bash
# Start Next.js dev server
npm run dev

# Start Genkit AI dev server (in a separate terminal)
npm run genkit:dev

# Start Firebase emulators (Auth, Firestore, Storage, PubSub)
npm run emulators
```

The app runs at `http://localhost:9002`.

### Build

```bash
npm run build
npm run start
```

### Linting & Type Checking

```bash
npm run lint
npm run typecheck
```

## Project Structure

```
src/
├── ai/                 # Genkit AI flows (card extraction, grading)
├── app/
│   ├── (app)/          # Authenticated routes (dashboard, collection, trades, etc.)
│   ├── (auth)/         # Login & signup pages
│   └── api/            # API routes (prices)
├── components/         # Shared UI components
├── firebase/           # Firebase client initialization & providers
├── hooks/              # Custom React hooks
└── lib/                # Utilities, types, and service logic
docs/
├── blueprint.md        # Original product specification
└── NEW_FEATURES.md     # Feature documentation and DB schema
```

## Deployment

The app is configured for Firebase App Hosting (`apphosting.yaml`). To deploy to Google Cloud Run and update the Gemini API secret:

```bash
gcloud run services update studio \
  --project=<PROJECT_ID> \
  --region=us-central1 \
  --update-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest

gcloud run services update-traffic studio \
  --project=<PROJECT_ID> \
  --region=us-central1 \
  --to-latest
```

## License

Private — all rights reserved.