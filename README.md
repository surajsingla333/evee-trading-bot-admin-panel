# Stack Admin Dashboard

Premium crypto/Web3 SaaS admin panel built with Vite, React, TypeScript, Tailwind CSS, Axios, Recharts, and Framer Motion.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** design tokens
- **React Router** for feature pages
- **Axios** client (`src/lib/api.ts`) ready for a real API
- **Recharts** for volume / growth / donut charts
- **Framer Motion** for page, sidebar, and micro-interactions
- **Satoshi** typography via Fontshare

## Architecture

```
src/
  app entry (App.tsx, main.tsx)
  components/     # layout + shared UI + charts
  config/         # navigation
  data/           # mock datasets (swap for Axios services)
  features/       # page modules per domain
  hooks/          # theme, sidebar, count-up
  lib/            # api, cn, format, motion
  types/          # shared TypeScript models
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build
npm run preview # preview dist
```

## Design system

| Token | Value |
|-------|-------|
| Primary | `#2563EB` |
| Surface | `#F8FAFC` |
| Dark bg | `#0B1220` |
| Border | `#E5E7EB` |
| Radius | 16–20px cards |

Light/dark mode persists in `localStorage` (`stack_theme`).

## Pages

Dashboard · Users · Wallets · Trades · Positions · Limit Orders · Leaderboard · Referrals · Referral Payments · Admin Users · Feature Toggles · Bot Storage · Settings
