# Birthday Surprise Website

Interactive birthday journey built from the master plan: mystery gate → reveal → letter → memories → wish cake → gift vault → finale.

## Quick start

```bash
cd birthday-surprise
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/s/demo`.

## Personalize

Edit `src/lib/birthday-config.ts`:

- Recipient / sender names
- Letter, memories, special cards
- Spinner gifts, mode (`guaranteed` | `random-unique` | `weighted`), max spins
- Audio path (`public/audio/birthday.mp3`)

## Share link

Use `/s/<token>` — any token creates an experience. Spin results persist for that token in server memory (demo). For production multi-device persistence, wire MongoDB into `experience-store.ts`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
node --experimental-strip-types scripts/test-spinner.mjs
```

## Stack

Next.js App Router · TypeScript · Tailwind CSS · GSAP · canvas-confetti · Zod
