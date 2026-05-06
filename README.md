# Learn Japan Web

Mobile-first Japanese learning web app built with Next.js 16 and TypeScript.

## Features

- JLPT N5 starter vocabulary deck
- SRS-style review card flow (Again, Hard, Good, Easy)
- Meaning quiz with instant feedback
- Kana practice tile grid
- Daily reminders and progress stats
- Optional Supabase anonymous auth + cloud progress sync
- Responsive UI designed for phone and desktop screens

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Build and check

```bash
npm run lint
npm run build
```

## Start in production mode

```bash
npm run build
npm run start
```

The start script runs the Next.js standalone server for production.

## Mobile install (PWA)

- On Android Chrome: open the site and tap Add to Home screen.
- On iOS Safari: open the site, tap Share, then Add to Home Screen.

## Supabase cloud sync setup (optional)

1. Create a Supabase project.
2. Copy .env.example to .env.local and set:
	- NEXT_PUBLIC_SUPABASE_URL
	- NEXT_PUBLIC_SUPABASE_ANON_KEY
3. In Supabase SQL editor, run [supabase/schema.sql](supabase/schema.sql).
4. In Authentication settings, enable anonymous sign-ins.

Without these env values, the app stays in local-only mode.

## Production deployment (Vercel)

1. Import this repository into Vercel and create a project.
2. In Vercel project settings, set environment variables from [.env.example](.env.example).
3. In GitHub repository secrets, add:
	- VERCEL_TOKEN
	- VERCEL_ORG_ID
	- VERCEL_PROJECT_ID
4. Push to main or run the GitHub Action manually:
	- [.github/workflows/deploy-vercel.yml](.github/workflows/deploy-vercel.yml)

## Health endpoint

- Runtime health check URL: /api/health
- File: [src/app/api/health/route.ts](src/app/api/health/route.ts)

## Daily reminders

- Use the Daily Reminder card in the app to set reminder hour and grant notification permission.
- Service worker file is [public/sw.js](public/sw.js).
- Reminders work as local device notifications and push-ready service worker events are handled.

## Docker

```bash
docker build -t learn-japan-web .
docker run --rm -p 3000:3000 learn-japan-web
```

Then open http://localhost:3000

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JS client (optional)
