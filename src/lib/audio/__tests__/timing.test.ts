import {
  calculateVOStartOffset,
  getVOTimingInfo,
  validateVOTiming,
} from '../timing';
import type { TrackMetadata } from '@/types/track';
import type { VOSegment } from '@/types/vo';

const createMockTrack = (overrides?: Partial<TrackMetadata>): TrackMetadata => ({
  id: 'test-track',
  filePath: 'tracks/test.mp3',
  title: 'Test Song',
  artist: 'Test Artist',
  duration: 180,
  timing: {
    intro: 10,
    outro: 12,
    coldOpen: false,
  },
  rotation: {
    category: 'A',
    energy: 4,
    playCount: 0,
    lastPlayed: null,
    addedDate: '2025-01-01T00:00:00Z',
  },
  explicit: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  version: 1,
  ...overrides,
});

const createMockVOSegment = (overrides?: Partial<VOSegment>): VOSegment => ({
  id: 'vo-1',
  fileUrl: 'vo/segment1.mp3',
  duration: 5,
  startOffset: 0,
  transcript: 'Test transcript',
  generatedAt: '2025-01-01T00:00:00Z',
  persona: 'Morning Mike',
  ...overrides,
});

describe('calculateVOStartOffset', () => {
  it('calculates correct start offset for standard case', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const offset = calculateVOStartOffset(track, voSegment);

    // intro (10) - buffer (0.5) - duration (6) = 3.5
    expect(offset).toBe(3.5);
  });

  it('ensures offset is never negative', () => {
    const track = createMockTrack({ timing: { intro: 5, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 8 });

    const offset = calculateVOStartOffset(track, voSegment);

    expect(offset).toBe(0);
  });

  it('uses default 0.5s buffer before vocals', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 5 });

    const offset = calculateVOStartOffset(track, voSegment);

    // intro (10) - buffer (0.5) - duration (5) = 4.5
    expect(offset).toBe(4.5);
  });

  it('handles very short VO segments', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 2 });

    const offset = calculateVOStartOffset(track, voSegment);

    // intro (10) - buffer (0.5) - duration (2) = 7.5
    expect(offset).toBe(7.5);
  });

  it('handles very long VO segments', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 15 });

    const offset = calculateVOStartOffset(track, voSegment);

    // Would be negative, so clamps to 0
    expect(offset).toBe(0);
  });

  it('handles tracks with minimal intro', () => {
    const track = createMockTrack({ timing: { intro: 3, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 2 });

    const offset = calculateVOStartOffset(track, voSegment);

    // intro (3) - buffer (0.5) - duration (2) = 0.5
    expect(offset).toBe(0.5);
  });
});

describe('getVOTimingInfo', () => {
  it('returns correct timing information', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const info = getVOTimingInfo(track, voSegment);

    expect(info.startOffset).toBe(3.5); // calculated offset
    expect(info.endTime).toBe(9.5); // 3.5 + 6
    expect(info.introLength).toBe(10);
    expect(info.bufferTime).toBe(0.5); // 10 - 9.5
  });

  it('calculates buffer time correctly', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const info = getVOTimingInfo(track, voSegment);

    // intro (10) - endTime (9.5) = 0.5s buffer
    expect(info.bufferTime).toBe(0.5);
  });

  it('shows negative buffer when VO would overlap vocals', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 12 });

    const info = getVOTimingInfo(track, voSegment);

    // VO is clamped to start at 0, ends at 12s, intro ends at 10s
    // buffer is 10 - 12 = -2s (negative means overlap)
    expect(info.startOffset).toBe(0);
    expect(info.endTime).toBe(12);
    expect(info.bufferTime).toBeLessThan(0);
  });

  it('shows positive buffer when VO fits with space', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 4 });

    const info = getVOTimingInfo(track, voSegment);

    // VO starts at 5.5, ends at 9.5, intro at 10 = 0.5s buffer
    expect(info.bufferTime).toBe(0.5);
  });
});

describe('validateVOTiming', () => {
  it('approves valid VO timing', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const result = validateVOTiming(track, voSegment);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects VO for cold open tracks', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: true, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const result = validateVOTiming(track, voSegment);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cold open');
  });

  it('rejects VO that is longer than intro minus buffer', () => {
    const track = createMockTrack({ timing: { intro: 5, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 5 });

    const result = validateVOTiming(track, voSegment);

    // VO duration (5) > intro (5) - buffer (0.5) = invalid
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds intro length');
  });

  it('approves VO that fits with buffer', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 9 });

    const result = validateVOTiming(track, voSegment);

    // VO duration (9) < intro (10) - buffer (0.5) = valid
    expect(result.valid).toBe(true);
  });

  it('provides helpful error messages for long VOs', () => {
    const track = createMockTrack({ timing: { intro: 5, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 10 });

    const result = validateVOTiming(track, voSegment);

    expect(result.reason).toBeTruthy();
    expect(result.reason).toMatch(/duration.*exceeds.*intro/i);
  });

  it('provides helpful error messages for cold opens', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: true, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6 });

    const result = validateVOTiming(track, voSegment);

    expect(result.reason).toBeTruthy();
    expect(result.reason).toMatch(/cold open/i);
  });
});

describe('Edge Cases and Special Scenarios', () => {
  it('handles zero-duration VO segment', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 0 });

    const offset = calculateVOStartOffset(track, voSegment);

    // Would start at intro - 0.5 buffer
    expect(offset).toBe(9.5);
  });

  it('handles exact fit scenario', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    // VO that exactly fits with buffer
    const voSegment = createMockVOSegment({ duration: 9.5 });

    const offset = calculateVOStartOffset(track, voSegment);
    const info = getVOTimingInfo(track, voSegment);

    expect(offset).toBe(0);
    expect(info.endTime).toBe(9.5);
    expect(info.bufferTime).toBe(0.5);
  });

  it('handles fractional timing values correctly', () => {
    const track = createMockTrack({ timing: { intro: 10.75, outro: 12, coldOpen: false, coldOut: false } });
    const voSegment = createMockVOSegment({ duration: 6.25 });

    const offset = calculateVOStartOffset(track, voSegment);

    // 10.75 - 0.5 - 6.25 = 4.0
    expect(offset).toBe(4);
  });

  it('validates VO that is exactly at limit', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    // 10 - 0.5 = 9.5 is the maximum duration
    const voSegment = createMockVOSegment({ duration: 9.5 });

    const result = validateVOTiming(track, voSegment);

    expect(result.valid).toBe(true);
  });

  it('rejects VO that is just over the limit', () => {
    const track = createMockTrack({ timing: { intro: 10, outro: 12, coldOpen: false, coldOut: false } });
    // 10 - 0.5 = 9.5 max, so 9.6 should fail
    const voSegment = createMockVOSegment({ duration: 9.6 });

    const result = validateVOTiming(track, voSegment);

    expect(result.valid).toBe(false);
  });
});
