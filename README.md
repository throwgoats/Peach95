# Peach95 Radio Automation

> Today's Hits and Yesterday's Favorites

A modern, web-based radio automation application built with Next.js, featuring a cart-based player system designed for on-air broadcasting.

## Features

### Phase 1 - MVP (v0.1.0) ✅
- 🎵 Audio playback with play/pause/stop controls
- 📊 Visual progress bar with seek functionality
- 🔊 Volume control with mute
- 📚 Track library with metadata display
- ⌨️ Keyboard shortcuts (Space, S, ↑/↓)
- 🎨 Modern, responsive UI with Tailwind CSS

### Phase 2 - Queue System (v0.2.0) ✅
- 🎯 Visual queue panel with drag-and-drop
- ⏭️ Skip button to advance to next track
- 🔄 Auto-advance when track ends
- 📝 Position badges ("Next" and numbers)
- ⏱️ Total queue duration display
- 🗑️ Clear queue and remove individual tracks
- ↕️ Reorder tracks within queue
- 🎭 Drag tracks from library to queue

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Audio Engine:** Howler.js
- **State Management:** Zustand
- **UI Components:** shadcn/ui + Tailwind CSS
- **Data Storage:** JSON files (11 tracks included)
- **TypeScript:** Full type safety with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Keyboard Shortcuts

- **Space** - Play/Pause
- **S** - Stop
- **↑/↓** - Volume Up/Down

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
│   ├── player/       # Player controls, progress, volume
│   ├── library/      # Track list components
│   ├── queue/        # Queue panel and items
│   ├── providers/    # DndProvider for drag-and-drop
│   └── ui/           # shadcn/ui base components
├── lib/              # Core logic
│   ├── audio/        # PlayerController (Howler wrapper)
│   └── metadata/     # JSON loader and schemas
├── stores/           # Zustand state management
├── types/            # TypeScript definitions
└── hooks/            # Custom React hooks

data/
└── tracks/           # Track metadata JSON files

media/
├── tracks/           # MP3 audio files (11 tracks)
├── stingers/         # Station IDs (future)
└── talent/           # DJ voiceovers (future)
```

## Metadata Management

Generate metadata for new tracks:

```bash
npm run generate-metadata
```

This scans `/media/tracks/` and creates JSON files in `/data/tracks/` with default metadata. Edit the JSON files to customize:

- Artist names
- Intro/outro times
- Category (A/B/C/D rotation)
- Energy levels (1-5)

## Future Roadmap

### Phase 3: Crossfading
- Overlap based on intro/outro metadata
- Multi-track audio mixing
- Configurable crossfade duration

### Phase 4: Format Clock
- CHR radio format automation
- Category-aware scheduling
- "Last played" enforcement

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

The project includes a comprehensive test suite using Jest and React Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ Utility functions (formatDuration, createSlug, etc.)
- ✅ PlayerController audio engine
- ✅ Zod schema validation
- ✅ React components (TrackInfo, etc.)

Current coverage: 35 passing tests across core functionality

## License

GNU General Public License v3.0

---

**Peach95** - Built with ❤️ for radio automation
