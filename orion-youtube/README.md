# ORION YouTube — Mobile Content Curation

A React Native (Expo) app that personalizes your YouTube feed using natural-language intent.

> Full architecture and behaviour docs: **[DOCUMENTATION.md](./DOCUMENTATION.md)**

## Quick Start

```bash
cd orion-youtube
npm install
npx expo start
```

Open on your phone with Expo Go, or run `a` for Android / `i` for iOS.

### YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create an API key (restrict to YouTube API only)
4. Enter the key in **Settings** tab inside the app

## Architecture

| Layer | File | Role |
|---|---|---|
| Rules | `engine/rules.ts` | Goal profiles, stopwords, intent parser |
| Scoring | `engine/scoring.ts` | `scoreVideo`, `rankVideos` — pure functions |
| YouTube | `engine/youtube-api.ts` | Search, trending, video details, formatting |
| Store | `store/preferences.ts` | AsyncStorage for prefs, blocklists, feedback |
| Feed | `app/(tabs)/index.tsx` | Personalized feed with scoring + filtering |
| Search | `app/(tabs)/search.tsx` | Intent-scored search results |
| Settings | `app/(tabs)/settings.tsx` | API key, goals, blocklists, filter mode |
| Intent | `app/intent.tsx` | Natural language intent editor |

## Goals

- **Placements** — campus placement prep, aptitude, coding rounds
- **Competitive Exams** — GATE, CAT, GRE, UPSC, JEE, NEET
- **Skill Learning** — programming, design, tools, frameworks

## How Scoring Works

Every video is scored 0–100 using:
- **Goal fit** (0–30) — vocabulary overlap with active goal
- **Interest fit** (0–25) — matches to stated interests
- **Token overlap** (0–20) — general keyword match
- **Exclusion penalty** (0 to −40) — penalties for excluded topics
- **Feedback boost** (−20 to +20) — likes/saves boost, skips suppress

Videos below score 48 are removed (or dimmed). Blocklisted items capped at 12.

## Tech Stack

- React Native 0.76 + Expo 52
- Expo Router (file-based tabs)
- AsyncStorage
- YouTube Data API v3
- TypeScript
- Vitest
