import { TrackMetadataSchema, SettingsSchema } from '../schema';

describe('TrackMetadataSchema', () => {
  const validTrack = {
    id: 'test-track',
    filePath: 'tracks/test.mp3',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    timing: {
      intro: 8,
      outro: 12,
      coldOpen: false,
      coldOut: false,
    },
    rotation: {
      category: 'A' as const,
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

  it('validates a valid track', () => {
    const result = TrackMetadataSchema.safeParse(validTrack);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const trackWithOptionals = {
      ...validTrack,
      album: 'Test Album',
      year: 2025,
      genre: 'Pop',
      bitrate: 320,
      sampleRate: 44100,
    };

    const result = TrackMetadataSchema.safeParse(trackWithOptionals);
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const invalidTrack = {
      ...validTrack,
      rotation: {
        ...validTrack.rotation,
        category: 'Z', // Invalid category
      },
    };

    const result = TrackMetadataSchema.safeParse(invalidTrack);
    expect(result.success).toBe(false);
  });

  it('rejects energy out of range', () => {
    const invalidTrack = {
      ...validTrack,
      rotation: {
        ...validTrack.rotation,
        energy: 6, // Out of range
      },
    };

    const result = TrackMetadataSchema.safeParse(invalidTrack);
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { title, ...incompleteTrack } = validTrack;

    const result = TrackMetadataSchema.safeParse(incompleteTrack);
    expect(result.success).toBe(false);
  });
});

describe('SettingsSchema', () => {
  const validSettings = {
    player: {
      defaultVolume: 0.8,
      crossfadeDuration: 5.0,
      enableCrossfade: false,
      enableAutoAdvance: false,
    },
    library: {
      defaultView: 'list' as const,
      sortBy: 'title',
      sortOrder: 'asc' as const,
    },
    version: 1,
  };

  it('validates valid settings', () => {
    const result = SettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('rejects invalid defaultView', () => {
    const invalidSettings = {
      ...validSettings,
      library: {
        ...validSettings.library,
        defaultView: 'invalid',
      },
    };

    const result = SettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it('rejects volume out of range', () => {
    const invalidSettings = {
      ...validSettings,
      player: {
        ...validSettings.player,
        defaultVolume: 1.5, // Out of range
      },
    };

    const result = SettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });
});
