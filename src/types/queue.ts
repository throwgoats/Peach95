import type { TrackMetadata } from './track';
import type { VOSegment } from './vo';

/**
 * Stinger segment (short musical transition, no voice)
 */
export interface StingerSegment {
  id: string;
  fileUrl: string;
  duration: number;
  category: 'sweeper' | 'whoosh' | 'impact' | 'musical';
  startOffset: number; // When to start stinger (seconds into song)
}

/**
 * Transition type for a queue item
 */
export type TransitionType = 'vo' | 'stinger' | 'none';

/**
 * Queue item with optional VO segment or stinger
 */
export interface QueueItem {
  track: TrackMetadata;
  voSegment?: VOSegment;
  stingerSegment?: StingerSegment;
  transitionType?: TransitionType; // Determined by clock/scheduling logic
  queuePosition: number;
  addedAt: string;
}

/**
 * Multi-track playback state for queue items
 */
export interface QueueItemPlaybackState {
  queuePosition: number;
  primaryPosition: number;
  secondaryPosition?: number;
  isPlaying: boolean;
  isPaused: boolean;
}
