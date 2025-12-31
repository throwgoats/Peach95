import type { TrackMetadata } from '../track';

describe('TrackMetadata Type', () => {
  it('accepts valid track with all required fields', () => {
    const validTrack: TrackMetadata = {
      id: 'test-id',
      filePath: 'test/path.mp3',
      title: 'Test Title',
      artist: 'Test Artist',
      duration: 180,
      timing: {
        intro: 0,
        outro: 0,
        coldOpen: false,
        coldOut: false,
      },
      rotation: {
        category: 'A',
        energy: 3,
        playCount: 0,
        lastPlayed: null,
        addedDate: '2025-01-01T00:00:00Z',
      },
      explicit: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      version: 1,
    };

    expect(validTrack).toBeDefined();
    expect(validTrack.rotation).toBeDefined();
    expect(validTrack.rotation.category).toBe('A');
  });

  it('accepts valid track with optional fields', () => {
    const trackWithOptionals: TrackMetadata = {
      id: 'test-id',
      filePath: 'test/path.mp3',
      title: 'Test Title',
      artist: 'Test Artist',
      album: 'Test Album',
      year: 2024,
      genre: 'Pop',
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
      timing: {
        intro: 0,
        outro: 0,
        hookStart: 60,
        coldOpen: false,
        coldOut: true,
      },
      rotation: {
        category: 'B',
        energy: 5,
        playCount: 10,
        lastPlayed: '2025-01-01T00:00:00Z',
        addedDate: '2025-01-01T00:00:00Z',
      },
      explicit: true,
      daypartRestrictions: ['morning', 'afternoon'],
      artwork: {
        url: 'https://example.com/art.jpg',
        embedded: true,
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      version: 1,
    };

    expect(trackWithOptionals).toBeDefined();
    expect(trackWithOptionals.album).toBe('Test Album');
    expect(trackWithOptionals.year).toBe(2024);
    expect(trackWithOptionals.artwork).toBeDefined();
  });

  it('rotation object has correct properties', () => {
    const track: TrackMetadata = {
      id: 'test-id',
      filePath: 'test/path.mp3',
      title: 'Test Title',
      artist: 'Test Artist',
      duration: 180,
      timing: {
        intro: 0,
        outro: 0,
        coldOpen: false,
        coldOut: false,
      },
      rotation: {
        category: 'C',
        energy: 4,
        playCount: 5,
        lastPlayed: '2025-01-01T00:00:00Z',
        addedDate: '2025-01-01T00:00:00Z',
      },
      explicit: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      version: 1,
    };

    // Verify rotation has expected properties
    expect(track.rotation.category).toBe('C');
    expect(track.rotation.energy).toBe(4);
    expect(track.rotation.playCount).toBe(5);
    expect(track.rotation.lastPlayed).toBe('2025-01-01T00:00:00Z');
    expect(track.rotation.addedDate).toBe('2025-01-01T00:00:00Z');

    // Verify rotation does NOT have frequency property
    // @ts-expect-error - frequency should not exist on rotation
    expect(track.rotation.frequency).toBeUndefined();
  });

  it('supports all valid category values', () => {
    const categories = ['A', 'B', 'C', 'D'] as const;

    categories.forEach((category) => {
      const track: TrackMetadata = {
        id: 'test-id',
        filePath: 'test/path.mp3',
        title: 'Test Title',
        artist: 'Test Artist',
        duration: 180,
        timing: {
          intro: 0,
          outro: 0,
          coldOpen: false,
          coldOut: false,
        },
        rotation: {
          category,
          energy: 3,
          playCount: 0,
          lastPlayed: null,
          addedDate: '2025-01-01T00:00:00Z',
        },
        explicit: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        version: 1,
      };

      expect(track.rotation.category).toBe(category);
    });
  });

  it('supports all valid energy values', () => {
    const energyLevels = [1, 2, 3, 4, 5] as const;

    energyLevels.forEach((energy) => {
      const track: TrackMetadata = {
        id: 'test-id',
        filePath: 'test/path.mp3',
        title: 'Test Title',
        artist: 'Test Artist',
        duration: 180,
        timing: {
          intro: 0,
          outro: 0,
          coldOpen: false,
          coldOut: false,
        },
        rotation: {
          category: 'A',
          energy,
          playCount: 0,
          lastPlayed: null,
          addedDate: '2025-01-01T00:00:00Z',
        },
        explicit: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        version: 1,
      };

      expect(track.rotation.energy).toBe(energy);
    });
  });

  it('handles null lastPlayed', () => {
    const track: TrackMetadata = {
      id: 'test-id',
      filePath: 'test/path.mp3',
      title: 'Test Title',
      artist: 'Test Artist',
      duration: 180,
      timing: {
        intro: 0,
        outro: 0,
        coldOpen: false,
        coldOut: false,
      },
      rotation: {
        category: 'D',
        energy: 2,
        playCount: 0,
        lastPlayed: null,
        addedDate: '2025-01-01T00:00:00Z',
      },
      explicit: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      version: 1,
    };

    expect(track.rotation.lastPlayed).toBeNull();
  });
});
