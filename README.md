# Chess

A polished, browser-based chess study built with React, Vite, chess.js, and Stockfish 18 WebAssembly.

Requires Node.js 20.19 or newer.

## Highlights

- Play human vs. human, human vs. computer, or computer vs. computer.
- Local Stockfish evaluation and moves in a dedicated Web Worker—no backend required.
- FEN and PGN imports, promotion, undo, restart, resign, board flipping, and move notation.
- Automatic local session restoration and live appearance controls.
- Responsive layout with reduced-motion and keyboard-focus support.

## Run locally

```bash
npm run install:client
npm run dev
```

Open `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

The static output is written to `client/dist` and can be hosted on any static web host.

## Engine licensing

The browser engine is Stockfish.js 18, distributed under GPLv3. Its license is included at `client/public/engine/COPYING.txt`; source and attribution details are in `client/public/engine/README.txt`.
