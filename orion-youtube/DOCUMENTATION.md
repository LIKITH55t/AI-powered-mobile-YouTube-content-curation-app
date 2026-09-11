# ORION — Mobile App Documentation

**A goal-shaped, AI-personalized YouTube feed for your phone.** ORION is a React
Native (Expo) mobile app that reads your interests from a plain-English prompt and
scores every video against them, so the feed shows what you're preparing for
(placements, competitive exams, or skills) and hides what you're not.

No backend needed. All scoring runs locally on your phone.

---

## 1. Quick Overview

| Topic | Detail |
|---|---|
| Platform | React Native 0.86 / Expo SDK 57 (iOS + Android) |
| Language | TypeScript |
| Navigation | Expo Router (bottom tabs) |
| Local storage | AsyncStorage (settings, blocklists, feedback) |
| Data source | YouTube Data API v3 |
| Scoring location | **On-device**, pure TypeScript modules |
| LLM | Not required — deterministic local intent parsing |

### What the app does

- Lets you describe what you want to watch in natural language (an **intent**).
- Fetches YouTube videos matching your intent.
- **Scores every video 0–100** using goal vocabulary, your interests, exclusions, and your past feedback.
- **Removes or dims** videos below the visibility threshold (score < 48).
- **Hard-blocks** channels and keywords from your settings, regardless of score.
- **Learns from your feedback** — likes/saves boost tags, skips/hides suppress them.
- Runs entirely offline for scoring — only the YouTube search needs the network.

---

## 2. How It Works On Mobile (End-to-End Flow)

```
You open the app
        │
        ▼
Feed tab focuses ──► loadPreferences() + loadFeedback() (AsyncStorage)
        │                     │
        │   apiKey set? ──────┤ (no) ─► "Set your YouTube API key in Settings"
        │                     │
        │                    (yes)
        ▼                    ▼
    pick active goal ──►  resolve intent (saved prompt or goal description)
        │                    │
        ▼                    ▼
  YouTube search/trending ──► raw videos (title, desc, tags, channel, stats)
        │
        ▼
      rankVideos()
   ┌────────────┬──────────────┬──────────────┐
   │ goal fit    │ interest fit │ token overlap│
   │ exclusion   │ feedback     │ blocklists   │
   └────────────┴──────────────┴──────────────┘
        │
        ▼
   score + action ('show' | 'dim' | 'remove')
        │
        ▼
   Feed renders → show / dim (fade to 35%) / Drop off-topic
        │
        ▼
   You tap Like / Save / Skip ──► recorded in AsyncStorage
                                      │
                                      ▼
              next feed load re-scores using that feedback
```

---

## 3. Screen-by-Screen Behaviour

### 3.1 Feed (Home tab)

- Horizontal **goal switcher**: Placements / Exams / Skills.
- Pull-to-refresh re-fetches and re-scores.
- **Stats bar** shows `kept · dimmed · removed` counts for the current batch.
- Each card shows thumbnail, duration, title, channel, views, time-ago.
- When **Remove** mode: off-topic videos are dropped from the list entirely.
- When **Dim** mode: off-topic videos stay but are faded to 35% opacity.
- **Score badges** (optional) show the 0–100 relevance on the thumbnail corner (green ≥70, yellow 48–69, red <48).
- Action buttons: ❤️ Like, 🔖 Save, ✖ Skip. Skip removes the video from the current list.

### 3.2 Search tab

- Free-text search against the YouTube API.
- Results are scored with the **same engine** using your saved intent, so even
  search hits are filtered to your goal.
- Like/Save/Skip work here too and feed the same feedback log.

### 3.3 Settings tab

- **YouTube API key** — stored in AsyncStorage and restored on every launch.
- **Goal** switcher (same as Feed).
- **Filter mode** — Remove (hidden) or Dim (faded).
- **Show score badges** toggle.
- **Blocked channels** — one per line; exact channel-name match forces removal.
- **Blocked keywords / spoiler phrases** — comma or line separated; substring match
  against title+description+tags forces removal.
- **Clear Feedback History** — resets the learning log.

### 3.4 Intent (modal, presented from Feed)

- A text area for your prompt, e.g. *"GATE preparation, math and physics. No
  coaching ads."*
- Four one-tap example prompts.
- **Live preview** of the parsed result: interest tags (green) and exclusion
  tags (red) as the engine sees them.
- Saving stores `{ interests, exclusions, rawPrompt }` locally.

---

## 4. The Intent Parser (`engine/rules.ts`)

Turns a natural-language prompt into machine-readable signals:

1. **Lowercases** the prompt.
2. Runs **exclusion patterns** first — phrases like
   `no / without / exclude / avoid / skip / don't want / filter out / hide`
   capture the tokens that follow them as *exclusions*.
3. Runs **inclusion patterns** — `interested in / i want / focus on / show me`
   capture the following tokens as *interests*.
4. **Fallback:** if nothing matched an inclusion phrase, the whole prompt is
   tokenized and added as interests, minus any tokens already flagged as exclusions.
5. Tokens are normalised through `tokenize()`: lowercase, alphanumerics only,
   stopword removal (`the, and, for, with, very …` and platform words like
   `video, watch, channel`).

Example:

| Input | Interests | Exclusions |
|---|---|---|
| `GATE prep, math and physics. Avoid coaching ads.` | gate, prep, math, physics | coaching, ads |
| `i want react native tutorials, no vlogs` | react, native, tutorials | vlogs |

---

## 5. The Scoring Engine (`engine/scoring.ts`)

Every video gets a transparent, deterministic 0–100 score built from saturating
(count-based) signals — not diluted hit-fractions — so scores spread across the
range instead of clumping near a baseline.

| Signal | Range | How it is computed |
|---|---|---|
| **Goal fit** | 0–30 | Unique terms of the active goal's vocabulary present in the video text, saturated at 3 matches |
| **Interest fit** | 0–25 | Explicit intent interests that appear, saturated at 1.5 |
| **Token overlap** | 0–20 | Ratio of post tokens shared with your intent vocab |
| **Exclusion penalty** | −40–0 | Each excluded term present scores −15, capped at −40 |
| **Feedback boost** | −20–20 | Video-level (like +5, save +8, skip −5, hide −10) + tag-level drift from your history |

The final score is clamped to [0, 100].

**Visibility threshold = 48.** Scores below that are off-topic:
- **Remove mode** → dropped from the feed.
- **Dim mode** → kept but faded (checks `score < 63`, i.e., threshold + 15).

**Blocklists always win:** if the channel is blocked or a keyword matches, the
score is capped at 12 and the video is always marked `remove` no matter what.

### Why scores spread instead of clumping

Using `saturate(matches, max) = 1 - e^(-matches/max)` means *more* matches push
the score higher rather than every mildly-relevant post landing at the same
50. Off-topic posts with zero signal land well below 48 and genuinely disappear.

---

## 6. Storage & State (`store/preferences.ts`)

Everything persists on the phone via AsyncStorage (two keys):

- `@orion_preferences`
  - `goalId`, `intent` (interests/exclusions/rawPrompt)
  - `filterMode` (`remove` | `dim`), `showScoreBadges`
  - `blockedChannels[]`, `blockedKeywords[]`
  - `enabled`, `apiKey`
- `@orion_feedback`
  - history of up to 500 feedback entries `{ videoId, action, tags, timestamp }`

Preferences are loaded with `loadPreferences()` (deep-merged over defaults) and
saved with `savePreferences()`. Feedback is appended with `addFeedback()` and
trimmed to the last 500 records.

**Note:** AsyncStorage is on-device, so all settings and learning stay private —
nothing is sent to any server.

---

## 7. YouTube Integration (`engine/youtube-api.ts`)

- `searchVideos(query, max, pageToken)` — free-text search + detail lookup
  (duration, views, likes, tags) via a second `/videos` call.
- `getTrending(regionCode)` — chart `mostPopular` feed for region IN.
- `setApiKey` / `getApiKey` — in-memory handle used while scoring; the durable
  copy lives in preferences and is re-applied on every app start.
- Formatters: `formatDuration` (`PT15M30S` → `15:30`), `formatViews` (1.2M),
  `timeAgo` (3h ago).

### Quota notes

YouTube Data API gives **10,000 units/day** free. A single search + details pair
costs a few units, so personal use is comfortably within the free tier. If the
quota runs out the feed shows a clear error instead of breaking.

---

## 8. Mobile-Specific Behaviour

- **Tabs stay mounted** — the Feed re-fetches via `useFocusEffect`, so switching
  to Settings, saving a key, and returning immediately refreshes the feed.
- **Feedback is instant** — like/save/skip writes to storage immediately and the
  current list updates (skip removes the card).
- **Pull-to-refresh** re-runs the full pipeline (fetch → score → filter).
- **Off-screen rendering** is avoided with `FlatList`, keeping the feed smooth
  even on modest phones.
- **Links out** — tapping a card opens the video in the system browser /
  YouTube app via `Linking.openURL`.

---

## 9. Project Layout

| Layer | File | Role |
|---|---|---|
| Types | `types.ts` | Shared TS interfaces + `DEFAULT_PREFERENCES` |
| Rules | `engine/rules.ts` | Goal profiles, stopwords, intent parser |
| Scoring | `engine/scoring.ts` | `scoreVideo`, `rankVideos` — pure, no I/O |
| YouTube | `engine/youtube-api.ts` | Search, trending, details, formatting |
| Store | `store/preferences.ts` | AsyncStorage read/write for prefs + feedback |
| Root | `app/_layout.tsx` | Stack shell (tabs + intent modal) |
| Tabs | `app/(tabs)/_layout.tsx` | Bottom tab navigator |
| Feed | `app/(tabs)/index.tsx` | Personalized scored feed |
| Search | `app/(tabs)/search.tsx` | Intent-scored search |
| Settings | `app/(tabs)/settings.tsx` | Key, goals, blocklists, modes |
| Intent | `app/intent.tsx` | Natural-language prompt editor |
| Components | `components/` | `VideoCard`, `ScoreBadge`, `FilterBar` |
| Tests | `engine/__tests__/scoring.test.ts` | 15 Vitest tests for the engine |

---

## 10. Running Tests

```powershell
cd orion-youtube
npx vitest run
```

15 tests cover:
- Intent parsing (interests, exclusions, stopword filtering, combined prompts)
- Scoring parity (relevant > irrelevant, exclusion penalties)
- Blocklist enforcement (channel + keyword, score capped at 12)
- Feedback boosts
- Ranking order and remove-mode filtering
- Goal profile integrity

---

## 11. Run It Yourself

```powershell
cd orion-youtube
npx expo start
```

Then:
- **Android phone:** install Expo Go, connect to the same Wi-Fi as your PC, scan
  the QR code shown in the terminal.
- **iPhone:** same — Expo Go scans the QR with the camera app.
- **Emulator:** press `a` (needs Android Studio / USB debugging).

Then in the app:
1. **Settings → YouTube API Key** → paste a key from
   https://console.cloud.google.com (enable **YouTube Data API v3** first) → Save.
2. Go to **Feed** — videos load and are scored automatically.
3. Tap the ✎ icon (or Feed → Set Your Intent) to describe what you want.

---

## 12. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| "Set your YouTube API key in Settings" | Feed hasn't re-focused after saving — tap the Feed tab again (it now reloads on focus) or press `r` to reload |
| `expo start` says "SDK 57" mismatch | Update Expo Go in the app store so both match SDK 57 |
| "Project is incompatible with Expo Go" | Your Expo Go is older than SDK 57 — update it |
| "No Android connected device found" | You pressed `a`; instead scan the QR with Expo Go on your phone |
| Everything gets removed | Your intent is too narrow or blocklists are too aggressive — loosen the prompt or dim mode |
| Scores all near 50 | Switch intent — scores spread via saturating signals, so a genuine signal gap drops posts below 48 |

---

## 13. Extending ORION

- **New goals:** add a `GoalProfile` to `GOALS` in `engine/rules.ts` — the UI,
  scoring, and FilterBar pick it up automatically.
- **New scoring signals:** extend `ScoreSignals` and `computeX` functions in
  `engine/scoring.ts`.
- **More platforms:** the YouTube adapter is isolated in `engine/youtube-api.ts`;
  swap it for another content source while reusing `rules.ts` + `scoring.ts`.
- **Server-backed LLM intent:** keep `parseIntent()` as the fallback and add an
  optional `expo-secure-store`-stored endpoint — the app never fails because the
  deterministic parser always runs.