import { usePlayerStore } from '../playerStore';
import type { TrackMetadata } from '@/types/track';
import type { VOGenerationResponse } from '@/types/vo';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the player controller (must be hoisted before imports)
jest.mock('@/lib/audio/player', () => ({
  getPlayerInstance: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    load: jest.fn(),
    loadWithVO: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    setVolume: jest.fn(),
    getPosition: jest.fn(() => 0),
    getDuration: jest.fn(() => 0),
    getCurrentTrack: jest.fn(() => null),
  })),
  PlayerEvent: {
    TRACK_LOADED: 'track:loaded',
    TRACK_ENDED: 'track:ended',
    PLAY: 'play',
    PAUSE: 'pause',
    STOP: 'stop',
    VOLUME_CHANGE: 'volume:change',
    POSITION_UPDATE: 'position:update',
    ERROR: 'error',
    VO_LOADED: 'vo:loaded',
    VO_PLAYING: 'vo:playing',
    VO_ENDED: 'vo:ended',
    VO_ERROR: 'vo:error',
    MULTI_TRACK_POSITION_UPDATE: 'multitrack:position',
  },
}));

// Mock timing utilities
jest.mock('@/lib/audio/timing', () => ({
  calculateVOStartOffset: jest.fn((track, segment) => 5),
  validateVOTiming: jest.fn(() => ({ valid: true })),
  getVOTimingInfo: jest.fn(() => ({
    startOffset: 5,
    endTime: 11,
    isValidTiming: true,
    warningMessage: null,
  })),
}));

// Mock talent utilities
jest.mock('@/types/talent', () => ({
  getDefaultTalentForDaypart: jest.fn(() => ({
    name: 'Morning Mike',
    displayName: 'Mike',
  })),
  selectRandomBreakType: jest.fn(() => 'short'),
  getTimeOfDay: jest.fn(() => 'morning'),
  BREAK_TYPES: {
    short: { label: 'Short VO', minDuration: 3, maxDuration: 5 },
    backsell: { label: 'Backsell', minDuration: 5, maxDuration: 10 },
  },
}));

const createMockTrack = (overrides?: Partial<TrackMetadata>): TrackMetadata => ({
  id: `track-${Math.random()}`,
  filePath: 'tracks/song.mp3',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  year: 2025,
  genre: 'Pop',
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

const mockVOResponse: VOGenerationResponse = {
  segment: {
    id: 'vo-1',
    fileUrl: '/media/vo/sample.mp3',
    duration: 6,
    startOffset: 5,
    transcript: 'Great music on Peach 95',
    generatedAt: new Date().toISOString(),
    persona: 'Morning Mike',
    breakType: 'short',
  },
  calculatedOffset: 5,
  recommendedIntro: 10,
};

describe('PlayerStore - VO Generation', () => {
  beforeEach(() => {
    // Reset store state
    usePlayerStore.setState({
      queueItems: [],
      queueItemStates: new Map(),
      activeTalent: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('generateVOForQueueItem', () => {
    it('successfully generates VO for a track in position 0', async () => {
      const track = createMockTrack();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      // addToQueue automatically triggers VO generation for top 3 positions
      await usePlayerStore.getState().addToQueue(track);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vo-segments',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toEqual(mockVOResponse.segment);
    });

    it('passes previousTrack when generating VO for position 1', async () => {
      const track1 = createMockTrack({ id: 'track-1', title: 'Song One', artist: 'Artist One' });
      const track2 = createMockTrack({ id: 'track-2', title: 'Song Two', artist: 'Artist Two' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      // addToQueue automatically triggers VO generation for both tracks
      await usePlayerStore.getState().addToQueue(track1);
      await usePlayerStore.getState().addToQueue(track2);

      // Second call should have previousTrack
      const callArgs = (global.fetch as jest.Mock).mock.calls[1];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.previousTrack).toEqual({
        title: 'Song One',
        artist: 'Artist One',
      });
      expect(requestBody.currentTrack.title).toBe('Song Two');
    });

    it('does not pass previousTrack for position 0', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.previousTrack).toBeUndefined();
    });

    it('passes nextTrack when available', async () => {
      const track1 = createMockTrack({ id: 'track-1', title: 'Song One' });
      const track2 = createMockTrack({ id: 'track-2', title: 'Song Two' });

      usePlayerStore.getState().addToQueue(track1);
      usePlayerStore.getState().addToQueue(track2);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.nextTrack).toEqual({
        title: 'Song Two',
        artist: 'Test Artist',
      });
    });

    it('skips VO generation for cold open tracks', async () => {
      const coldOpenTrack = createMockTrack({
        timing: { intro: 0, outro: 12, coldOpen: true },
      });

      usePlayerStore.getState().addToQueue(coldOpenTrack);

      await usePlayerStore.getState().generateVOForQueueItem(0);

      expect(global.fetch).not.toHaveBeenCalled();

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toBeUndefined();
    });

    it('handles 400 errors gracefully (no VO attached)', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      // Should not throw
      await expect(usePlayerStore.getState().generateVOForQueueItem(0)).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toBeUndefined();
    });

    it('retries on 500 errors up to 2 times', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      // Mock first 2 attempts fail with 500, third succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVOResponse,
        });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      // Should have tried 3 times total (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toEqual(mockVOResponse.segment);
    });

    it('gives up after max retries and plays without VO', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      // All attempts fail with 500
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(usePlayerStore.getState().generateVOForQueueItem(0)).resolves.not.toThrow();

      // Should have tried 3 times total (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toBeUndefined();
    });

    it('handles invalid segment response gracefully', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          segment: null, // Invalid
        }),
      });

      await expect(usePlayerStore.getState().generateVOForQueueItem(0)).resolves.not.toThrow();

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toBeUndefined();
    });

    it('handles missing fileUrl in segment', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          segment: {
            id: 'vo-1',
            duration: 6,
            // Missing fileUrl
          },
        }),
      });

      await expect(usePlayerStore.getState().generateVOForQueueItem(0)).resolves.not.toThrow();

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toBeUndefined();
    });

    it('includes active talent in request', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      usePlayerStore.setState({
        activeTalent: {
          id: 'talent-1',
          name: 'Afternoon Anna',
          displayName: 'Anna',
          style: 'smooth',
          dayparts: ['afternoon'],
          bio: 'Afternoon DJ',
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.persona).toBe('Afternoon Anna');
    });

    it('uses default talent when no active talent', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.persona).toBe('Morning Mike');
    });

    it('includes timeOfDay in request', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Check that timeOfDay is included (actual value depends on current time)
      expect(requestBody.timeOfDay).toMatch(/morning|afternoon|evening|overnight/);
    });

    it('includes energyLevel from track rotation', async () => {
      const track = createMockTrack({ rotation: { ...createMockTrack().rotation, energy: 5 } });
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.energyLevel).toBe(5);
    });

    it('includes breakType in request', async () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      await usePlayerStore.getState().generateVOForQueueItem(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.breakType).toBe('short');
    });
  });

  describe('attachVOToQueueItem', () => {
    it('attaches VO segment to queue item', () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      usePlayerStore.getState().attachVOToQueueItem(0, mockVOResponse.segment);

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment).toEqual(mockVOResponse.segment);
    });

    it('replaces existing VO segment', () => {
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      const firstVO = { ...mockVOResponse.segment, id: 'vo-first' };
      const secondVO = { ...mockVOResponse.segment, id: 'vo-second' };

      usePlayerStore.getState().attachVOToQueueItem(0, firstVO);
      usePlayerStore.getState().attachVOToQueueItem(0, secondVO);

      const queueItem = usePlayerStore.getState().queueItems[0];
      expect(queueItem.voSegment?.id).toBe('vo-second');
    });

    it('does not affect other queue items', () => {
      const track1 = createMockTrack({ id: 'track-1' });
      const track2 = createMockTrack({ id: 'track-2' });

      usePlayerStore.getState().addToQueue(track1);
      usePlayerStore.getState().addToQueue(track2);

      usePlayerStore.getState().attachVOToQueueItem(0, mockVOResponse.segment);

      expect(usePlayerStore.getState().queueItems[0].voSegment).toBeDefined();
      expect(usePlayerStore.getState().queueItems[1].voSegment).toBeUndefined();
    });
  });

  describe('Integration - Queue Operations', () => {
    it('automatically triggers VO generation when track added to position 0', async () => {
      // This would need to test the actual queue add logic
      // For now, we're testing the generateVOForQueueItem directly
      const track = createMockTrack();
      usePlayerStore.getState().addToQueue(track);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVOResponse,
      });

      // In the actual implementation, addToQueue should trigger generation
      // For this test, we'll call it manually
      await usePlayerStore.getState().generateVOForQueueItem(0);

      expect(usePlayerStore.getState().queueItems[0].voSegment).toBeDefined();
    });

    it('VO generation continues even if previous generation is in progress', async () => {
      const track1 = createMockTrack({ id: 'track-1' });
      const track2 = createMockTrack({ id: 'track-2' });

      usePlayerStore.getState().addToQueue(track1);
      usePlayerStore.getState().addToQueue(track2);

      // Simulate slow first request
      const slowPromise = new Promise(resolve => setTimeout(resolve, 1000));
      (global.fetch as jest.Mock)
        .mockImplementationOnce(async () => {
          await slowPromise;
          return {
            ok: true,
            json: async () => ({ ...mockVOResponse, segment: { ...mockVOResponse.segment, id: 'vo-1' } }),
          };
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockVOResponse, segment: { ...mockVOResponse.segment, id: 'vo-2' } }),
        });

      // Start both generations
      const promise1 = usePlayerStore.getState().generateVOForQueueItem(0);
      const promise2 = usePlayerStore.getState().generateVOForQueueItem(1);

      await Promise.all([promise1, promise2]);

      expect(usePlayerStore.getState().queueItems[0].voSegment?.id).toBe('vo-1');
      expect(usePlayerStore.getState().queueItems[1].voSegment?.id).toBe('vo-2');
    });
  });
});
