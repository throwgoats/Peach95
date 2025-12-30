import { formatDuration, createSlug, safeJsonParse } from '../utils';

describe('formatDuration', () => {
  it('formats seconds to MM:SS correctly', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('handles decimal seconds', () => {
    expect(formatDuration(45.7)).toBe('0:45');
    expect(formatDuration(125.99)).toBe('2:05');
  });
});

describe('createSlug', () => {
  it('converts filename to slug', () => {
    expect(createSlug('Just Like A Phoenix.mp3')).toBe('just-like-a-phoenix');
    expect(createSlug('Love Run This.mp3')).toBe('love-run-this');
  });

  it('handles special characters', () => {
    expect(createSlug('What Have I Done?.mp3')).toBe('what-have-i-done');
    expect(createSlug('Song #1 (Remix).mp3')).toBe('song-1-remix');
  });

  it('removes leading/trailing dashes', () => {
    expect(createSlug('-Test-.mp3')).toBe('test');
  });

  it('handles multiple spaces', () => {
    expect(createSlug('Title   With   Spaces.mp3')).toBe('title-with-spaces');
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}', {});
    expect(result).toEqual({ key: 'value' });
  });

  it('returns fallback on invalid JSON', () => {
    const fallback = { default: true };
    const result = safeJsonParse('invalid json', fallback);
    expect(result).toEqual(fallback);
  });

  it('returns fallback on empty string', () => {
    const fallback = { default: true };
    const result = safeJsonParse('', fallback);
    expect(result).toEqual(fallback);
  });
});
