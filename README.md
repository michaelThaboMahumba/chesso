# Chesso

Autonomous Chess Agent for Learning

Chesso is an experimental prototype: an inspectable AI chess tutor that **plays**, **explains**, and **critiques** inside a two-pane interface. The left side displays a chat-driven reasoning feed; the right side is a live chess sandbox. The system is intentionally minimal and built for rapid iteration.

---
<p align="center"> <img src="public/chesso.PNG" width="620" /> </p>

## Overview

* Chat-style reasoning log on the left, always visible.
* Interactive chessboard on the right with labeled ranks/files and timers.
* Agent outputs short explanations and critiques after each move.
* Pieces are moved programmatically through an execution layer.
* Prototype uses shallow Stockfish WASM or simple scripted behavior.
  Reasoning is placeholder text intended to demonstrate UX and loop.

---

## Features

* **Two-column layout**
  Left: chat input at the top, message log below, agent-thinking indicator under the log.
  Right: chessboard sandbox with coordinates and player timers.

* **Navbar controls**
  Includes a pause/stop button with an active state.

* **Agent-thinking indicator**
  Appears only during the agent’s turn; uses a video-player loading icon.

* **Chess engine integration**
  Stockfish WASM for lightweight in-browser evaluation.
  Random legal move fallback for mock mode.

* **No persistence**
  Refresh clears the session.
  Responsive layout: on mobile, chat stacks above the chessboard.

---

## Tech Stack

* **Next.js (App Router)**
* **React**
* **chess.js** for rules and validation
* **Stockfish WASM** for browser engine evaluation
* **CSS modules / Tailwind / custom system** depending on implementer preference

---

## Design System (Snapshot)

* Primary background: `#0b0b0b`
* Panel: `#121212`
* Surface: `#2f2f2f`
* Light text: `#e9e9e9`
* Accent: `#cfcfcf`
* Board light square: `#ffffff`
* Board dark square: `#2b2b2b`
* Inter for UI text
* Menlo / SFMono for agent messages
* Tight spacing, 12px gutters, low-radius components (2–3px)

---

## Suggested Folder Structure

```
E:.
├── app
├── components
│   └── ui
├── hooks
├── lib
│   ├── agents
│   └── promptengineering
├── public
└── styles
```

---

## Getting Started

1. Install dependencies:
   `npm install`
2. Run development server:
   `npm run dev`
3. Open `http://localhost:3000`
4. Move a piece; the agent updates the chat log and produces a dummy response.
   The execution layer animates the agent move.

---

## Agent Pipeline (Prototype)

1. **onUserMove()**

   * Validate using `chess.js`.
   * Update board state.

2. **Set agentThinking = true**

   * Display loading/video icon below the chat.

3. **Compute agent move**

   * Use Stockfish WASM (`go depth 8`) or fallback logic.

4. **Generate output entries**

   * Move announcement
     `AGENT: <move> — <short reasoning>`
   * Teaching hint
     `TIP: <brief guidance>`

5. **ExecutionAgent**

   * Apply move with `chess.move()`.
   * Update board with `board.position(chess.fen())`.

6. **Set agentThinking = false**

---

## Roadmap

* Integrate full LLM reasoning via secure serverless API.
* Offer deeper strategic analysis using server-side Stockfish.
* Add accounts, persistence, and premium tiers for multi-step reasoning depth.
* Generate shareable clips/GIFs for social engagement.
* Add analytics and structured evaluation of teaching effectiveness.

---
