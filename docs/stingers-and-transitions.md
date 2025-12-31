# Stingers and Transition Types

## Overview

The automation system supports three types of transitions between songs:
1. **VO (Voice-Over)**: DJ talking over song intro - currently implemented
2. **Stinger**: Short musical/sonic transition - planned
3. **None**: Direct segue from song to song - planned

## Transition Selection Logic

The **clock/scheduling system** (to be implemented) will determine which transition type to use based on:
- Time of day
- Day of week
- Programming hour/daypart
- Special events/holidays
- Station format requirements
- **Track characteristics** (cold open tracks ALWAYS get stingers, never VO)

### Example Clock Rules

```typescript
// Future clock implementation
interface ClockRule {
  daypart: 'morning' | 'afternoon' | 'evening' | 'overnight';
  voFrequency: number;      // % of songs with VO
  stingerFrequency: number; // % of songs with stinger
  // Remainder gets no transition (direct segue)
}

const exampleRules = {
  morning: { voFrequency: 70, stingerFrequency: 20 }, // 70% VO, 20% stinger, 10% none
  afternoon: { voFrequency: 50, stingerFrequency: 30 }, // 50% VO, 30% stinger, 20% none
  evening: { voFrequency: 40, stingerFrequency: 40 }, // 40% VO, 40% stinger, 20% none
  overnight: { voFrequency: 20, stingerFrequency: 50 }, // 20% VO, 50% stinger, 30% none
};
```

### Cold Open Tracks - Special Case

**Rule**: Tracks with `coldOpen: true` **ALWAYS** get a stinger transition, never VO.

**Reasoning**:
- Cold open tracks start immediately with vocals (no instrumental intro)
- VO over vocals sounds unprofessional and muddy
- A stinger bridges the previous song to the cold open perfectly
- Clock rules are overridden for cold opens

**Implementation**:
```typescript
export function determineTransitionType(track: TrackMetadata, ...): TransitionType {
  // Cold opens ALWAYS get stingers
  if (track.timing.coldOpen) {
    return 'stinger';
  }

  // Normal clock rules for other tracks
  const daypart = getDaypart(currentTime);
  const rules = getClockRules(daypart);
  // ... weighted random selection
}
```

## Stinger Types

### Categories

1. **Sweeper** (3-8 seconds)
   - Branded musical elements with station name/slogan
   - Example: Musical riff + "Peach 95!" voiceover
   - Use: Brand reinforcement, upbeat transitions

2. **Whoosh** (1-3 seconds)
   - Quick sonic transitions
   - No voice, just sound effect
   - Use: Fast pace, energy maintenance

3. **Impact** (0.5-2 seconds)
   - Very short punctuation
   - Drop, hit, or boom effect
   - Use: Dramatic transitions, tempo changes

4. **Musical** (2-5 seconds)
   - Instrumental bed/riff
   - Matches station format/genre
   - Use: Smooth transitions, energy bridging

### Stinger Library Structure

```
public/media/stingers/
├── sweepers/
│   ├── peach95-sweeper-01.mp3  (8s, high energy)
│   ├── peach95-sweeper-02.mp3  (5s, medium energy)
│   └── peach95-sweeper-03.mp3  (6s, upbeat)
├── whoosh/
│   ├── whoosh-fast.mp3         (1.5s)
│   ├── whoosh-smooth.mp3       (2s)
│   └── whoosh-reverse.mp3      (2.5s)
├── impact/
│   ├── drop-heavy.mp3          (0.8s)
│   ├── hit-bright.mp3          (1s)
│   └── boom-deep.mp3           (1.2s)
└── musical/
    ├── guitar-riff-01.mp3      (3s)
    ├── synth-bed-01.mp3        (4s)
    └── piano-flourish.mp3      (2.5s)
```

## Implementation Plan

### Phase 1: Stinger Selection Logic (Current State + Planning)

**Status**: Types defined, waiting for stinger audio files

**Location**: `src/lib/audio/stingers.ts` (to be created)

```typescript
export function selectStinger(
  track: TrackMetadata,
  energy: number,
  category?: StingerCategory
): StingerSegment {
  // Select appropriate stinger based on:
  // - Track energy level
  // - Intro length (must fit)
  // - Preferred category (if specified)
  // - Time of day (upbeat in morning, smooth at night)
}

export function calculateStingerTiming(
  track: TrackMetadata,
  stinger: StingerSegment
): number {
  // Similar to VO timing calculation
  // Start stinger so it ends just before vocal starts
  const introLength = track.timing.intro;
  const stingerDuration = stinger.duration;
  const targetEndTime = introLength - 0.5;
  return Math.max(0, targetEndTime - stingerDuration);
}
```

### Phase 2: Clock System Integration

**Status**: Not yet implemented

**Location**: `src/lib/scheduling/clock.ts` (to be created)

```typescript
export function determineTransitionType(
  position: number,
  currentTime: Date,
  queueContext: QueueContext
): TransitionType {
  // Check current clock rules
  const daypart = getDaypart(currentTime);
  const rules = getClockRules(daypart);

  // Weighted random selection based on rules
  const rand = Math.random() * 100;
  if (rand < rules.voFrequency) return 'vo';
  if (rand < rules.voFrequency + rules.stingerFrequency) return 'stinger';
  return 'none';
}
```

### Phase 3: Store Integration

**Status**: Prepared (see TODO comments in `playerStore.ts:321-326`)

**Changes needed**:

1. Update `generateVOForQueueItem()` to check `transitionType`:
```typescript
// In generateVOForQueueItem()
const transitionType = queueItem.transitionType || determineTransitionType(...);

switch (transitionType) {
  case 'vo':
    // Current VO generation logic
    break;
  case 'stinger':
    const stinger = selectStinger(queueItem.track, ...);
    get().attachStingerToQueueItem(position, stinger);
    break;
  case 'none':
    // No transition needed
    break;
}
```

2. Add `attachStingerToQueueItem()` action:
```typescript
attachStingerToQueueItem: (position: number, segment: StingerSegment) => {
  const { queueItems } = get();
  const newItems = [...queueItems];

  if (position < newItems.length) {
    newItems[position] = {
      ...newItems[position],
      stingerSegment: segment,
      transitionType: 'stinger'
    };
    set({ queueItems: newItems });
  }
}
```

### Phase 4: Player Support

**Status**: Already supported!

The multi-track player system already handles secondary audio tracks. Stingers will work exactly like VO segments:
- Load stinger as secondary track
- Calculate timing offset
- Play synchronized with intro

**No changes needed** to `PlayerController` - it treats stingers and VO identically.

## UI Indicators

### Queue Item Display

Update `QueueItem.tsx` to show transition type:

```tsx
{queueItem.voSegment && (
  <VOInfoBar segment={queueItem.voSegment} track={queueItem.track} />
)}

{queueItem.stingerSegment && (
  <StingerInfoBar segment={queueItem.stingerSegment} track={queueItem.track} />
)}

{queueItem.transitionType === 'none' && (
  <Badge variant="outline" className="text-xs">Direct Segue</Badge>
)}
```

### Position Badge

Update `PositionBadge.tsx` to show different colors/icons:
- Green dot: VO ready
- Blue dot: Stinger ready
- No dot: Direct segue

## Timing Considerations

### VO vs Stinger Timing

**Similarities**:
- Both play during intro
- Both should end before lead vocal
- Both use `calculateStartOffset()` logic

**Differences**:
- VO typically 3-8 seconds (speech + branding)
- Stingers typically 0.5-5 seconds (shorter, punchier)
- Stingers can be even tighter on timing (don't need speech breathing room)

### Buffer Times

```typescript
const VO_END_BUFFER = 0.5;      // 500ms before vocal
const STINGER_END_BUFFER = 0.3;  // 300ms before vocal (can be tighter)
```

## Future Enhancements

1. **Smart Stinger Selection**
   - Match stinger energy to track energy
   - Match stinger tempo to track tempo
   - Avoid repetition (don't play same stinger twice in a row)

2. **Stinger + VO Combo**
   - Stinger plays first (0-2s)
   - VO follows immediately (2-8s)
   - More production value for key moments

3. **Dynamic Stinger Creation**
   - AI-generated custom stingers
   - Track-specific musical elements
   - Personalized branding

4. **A/B Testing**
   - Track listener engagement by transition type
   - Optimize clock rules based on data
   - Different formats for different audiences

## Current State

✅ **Implemented**:
- Type definitions (`StingerSegment`, `TransitionType`)
- Queue item support (`QueueItem.stingerSegment`, `QueueItem.transitionType`)
- Multi-track player (already supports secondary audio)
- Top 3 generation window (ready for any transition type)

⏳ **Pending**:
- Stinger audio file library
- Stinger selection logic (`selectStinger()`)
- Clock/scheduling system (`determineTransitionType()`)
- Store integration (branching logic in `generateVOForQueueItem()`)
- UI components (`StingerInfoBar`, updated `PositionBadge`)

📋 **Future**:
- Smart selection algorithms
- Stinger + VO combos
- Dynamic generation
- Analytics/A/B testing
