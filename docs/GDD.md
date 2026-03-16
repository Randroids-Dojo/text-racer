# Text Racer (TR) - Game Design Document

## Overview

**Title:** Text Racer
**Genre:** Chat-driven typing race
**Platform:** Web (browser-based, streamed via SBB)
**Players:** Multiplayer via Twitch/YouTube chat
**Target Audience:** Stream viewers

## Concept

Text Racer is a chat-controlled racing game for live streams. Four colored cars (Red, Green, Blue, Yellow) race across a straight track. Stream viewers move cars forward by typing the next word in a shared sentence via chat commands. The first car to complete the entire sentence wins.

## How It Works

### Command Format

```
SBB TR [COLOR] [WORD]
```

- `SBB` — Standard SBB prefix (required for all StreamerBillboard commands)
- `TR` — Text Racer game prefix
- `[COLOR]` — Single letter: `R` (Red), `G` (Green), `B` (Blue), `Y` (Yellow)
- `[WORD]` — The next expected word for that car's sentence

### Example Race

Sentence: **"The quick brown fox jumps over the lazy dog"**

1. Viewer sends: `SBB TR R The` → Red car advances (next word: "quick")
2. Viewer sends: `SBB TR B The` → Blue car advances (next word: "quick")
3. Viewer sends: `SBB TR R quick` → Red car advances (next word: "brown")
4. Viewer sends: `SBB TR R fox` → **Rejected** — wrong word (expected "brown")
5. Viewer sends: `SBB TR G The` → Green car advances (next word: "quick")

### Rules

- Each car tracks its own position in the sentence independently
- Only the **exact next word** is accepted (case-insensitive to start)
- Wrong words are silently ignored — no penalty, just no movement
- If two people send the same correct word at the same time, only the first one processed counts
- First car to complete the full sentence wins the race

## Visual Design

### Art Style

Arcade vector wireframe with neon glow — matching Determined's spaceship level (Level 3):

- **Dark background** with subtle gradient
- **Wireframe/vector cars** drawn with canvas paths, no images
- **Multi-pass neon glow** using shadowBlur (bright core + expanded halo)
- **Race track** as a straight horizontal lane with grid/perspective lines
- **Four lanes** — one per car color

### Color Palette

| Element | Color |
|---------|-------|
| Background | Deep dark (#04020E range) |
| Track lines | Cyan glow (#00FFFF) |
| Red car | #FF3333 |
| Green car | #33FF33 |
| Blue car | #3333FF |
| Yellow car | #FFFF33 |
| Text/HUD | Off-white (#EEFFFF) |

### Screen Layout

```
┌──────────────────────────────────────────────────────┐
│  TEXT RACER                               FINISH LINE│
│──────────────────────────────────────────────────────│
│  🔴►  The  quick  [BROWN]  fox  jumps  over  ...    │
│  🟢──────►  The  [QUICK]  brown  fox  jumps  ...    │
│  🔵►  [THE]  quick  brown  fox  jumps  over  ...    │
│  🟡────►  The  [QUICK]  brown  fox  jumps  ...      │
│──────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────┘
```

- Each lane has its own copy of the sentence displayed on the road
- Words appear ahead of the car, laid out along the lane
- The **current word** (next to type) is brightly highlighted in the car's color
- Completed words are dimmed/faded
- Upcoming words are visible but subdued
- The car advances along the road as words are completed
- Shows as many words as fit on screen; if the race uses multiple sentences, the road refreshes with the next sentence when a car reaches the end

## SBB Integration

### Architecture

Text Racer runs as a standalone web app, loaded in an iframe by SBB.

**Communication flow:**
```
Chat (Twitch/YouTube)
  → SBB command parser (prefix: "TR")
  → postMessage to Text Racer iframe
  → Game processes move
  → Car advances on screen
```

### Message Protocol

**Init message (from SBB):**
```json
{ "source": "sbb", "type": "init", "game": "tr" }
```

**Game command (from SBB):**
```json
{ "source": "sbb", "type": "tr", "color": "r", "word": "quick", "username": "viewer123" }
```

### SBB Registration (in StreamerBillboard repo)

1. Add `"tr"` to `GAME_NAMES` set
2. Add `tr: "https://text-racer-app.vercel.app"` to `GAME_URLS`
3. Create `parseTR()` parser for `SBB TR [R/G/B/Y] [word]` format
4. Add `"tr"` case to command processor

## Tech Stack

- **Rendering:** HTML5 Canvas 2D (no libraries)
- **Language:** Vanilla JavaScript (ES modules)
- **Hosting:** Vercel (zero-config static deployment)
- **CI/CD:** GitHub Actions → Vercel auto-deploy
- **State:** In-memory game state (no backend needed)

## Game States

1. **Waiting** — Displays "Waiting for SBB..." or local start button
2. **Countdown** — 3... 2... 1... GO!
3. **Racing** — Cars move as commands come in
4. **Finish** — Winner announcement with celebration effect
5. **Reset** — Auto-reset after a delay, or on new game command

## MVP Milestones

1. **Project setup** — index.html, vercel.json, GitHub Actions workflow, canvas boilerplate
2. **Track rendering** — Four-lane racetrack with wireframe vector art style
3. **Car rendering** — Four colored wireframe cars with neon glow
4. **Sentence display** — Show the race sentence with word tracking per car
5. **Game logic** — Process word commands, advance cars, detect winner
6. **SBB integration** — postMessage listener, init handling
7. **Race flow** — Countdown, racing, finish, reset states
8. **SBB registration** — Add TR parser to StreamerBillboard repo

## Stretch Goals

- Multiple sentence pools / random selection
- Difficulty modes (longer sentences, punctuation required)
- Speed boost animations when a car completes several words quickly
- Viewer stats (who contributed most words to the winning car)
- Sound effects (engine rev, word accepted, winner fanfare)
- Race history / win counter per color
- Spectator word highlight (flash the word on screen when accepted)

## Canvas Size

800x450px (matching Determined's canvas dimensions)
