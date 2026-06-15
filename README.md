# Simple VMG Calculator

A web-based **Velocity Made Good (VMG)** calculator for sailors. Compare two sailing courses and instantly see which course makes better progress toward a windward mark.

## What is VMG?

VMG (Velocity Made Good) measures how fast a vessel is actually progressing toward a destination (such as a windward mark), accounting for the angle sailed relative to the direct course.

## Formula

```
Progress = SOG × cos(COG offset)
```

- **SOG** — Speed Over Ground (knots)
- **COG offset** — Angle in degrees between your course and the direct course to the mark

## How to Use

1. **Dataset A – Direct Course**: Enter the boat's speed (SOG) when sailing directly toward the mark (COG offset = 0°).
2. **Dataset B – Offset Course**: Enter the boat's speed (SOG) and the angle offset (COG offset in degrees) when sailing a different angle.
3. The calculator computes effective progress for both courses and highlights the more efficient option.

The interactive bearing diagram visualises both courses and their projected progress toward the mark.

## Development

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Lint

```bash
npm run lint
```
