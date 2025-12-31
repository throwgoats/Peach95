import type { TrackMetadata } from '@/types/track';
import type { VOSegment } from '@/types/vo';

/**
 * Calculate when to start VO segment based on intro timing
 * Ensures VO ends just before the vocal starts ("hitting the post")
 *
 * @param track - Track metadata with intro timing
 * @param voSegment - VO segment to schedule
 * @returns Start offset in seconds (when to start VO relative to song start)
 */
export function calculateVOStartOffset(
  track: TrackMetadata,
  voSegment: VOSegment
): number {
  const introLength = track.timing.intro;
  const voDuration = voSegment.duration;

  // Calculate offset to end VO just before intro ends
  // Leave 0.5s buffer before vocal starts
  const targetEndTime = introLength - 0.5;
  const startOffset = Math.max(0, targetEndTime - voDuration);

  return startOffset;
}

/**
 * Validate if VO segment can fit in track intro
 *
 * @param track - Track metadata with intro timing
 * @param voSegment - VO segment to validate
 * @returns Validation result with reason if invalid
 */
export function validateVOTiming(
  track: TrackMetadata,
  voSegment: VOSegment
): { valid: boolean; reason?: string } {
  const introLength = track.timing.intro;
  const voDuration = voSegment.duration;

  // Track has cold open - no intro
  if (track.timing.coldOpen) {
    return {
      valid: false,
      reason: 'Track has cold open (no intro)'
    };
  }

  // VO is too long for intro
  if (voDuration > introLength - 0.5) {
    return {
      valid: false,
      reason: `VO duration (${voDuration}s) exceeds intro length (${introLength}s)`
    };
  }

  return { valid: true };
}

/**
 * Get timing metadata for UI display
 *
 * @param track - Track metadata with intro timing
 * @param voSegment - VO segment
 * @returns Detailed timing information
 */
export function getVOTimingInfo(
  track: TrackMetadata,
  voSegment: VOSegment
): {
  startOffset: number;
  endTime: number;
  introLength: number;
  bufferTime: number;
} {
  const startOffset = calculateVOStartOffset(track, voSegment);
  const endTime = startOffset + voSegment.duration;
  const introLength = track.timing.intro;
  const bufferTime = introLength - endTime;

  return { startOffset, endTime, introLength, bufferTime };
}
