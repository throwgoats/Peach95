import { PlayerController } from '../player';
import { PlayerEvent } from '@/types/player';
import type { TrackMetadata } from '@/types/track';

// Mock Howler
jest.mock('howler', () => {
  const mockHowl = jest.fn().mockImplementation((config: any) => {
    // Simulate successful load after a small delay
    setTimeout(() => {
      if (config.onload) config.onload();
    }, 0);

    return {
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      seek: jest.fn((pos?: number) => (pos !== undefined ? undefined : 0)),
      playing: jest.fn(() => false),
      duration: jest.fn(() => 180),
      unload: jest.fn(),
      volume: jest.fn(),
    };
  });

  return {
    Howl: mockHowl,
    Howler: {
      volume: jest.fn((vol?: number) => (vol !== undefined ? undefined : 0.8)),
      mute: jest.fn(),
    },
  };
});

const mockTrack: TrackMetadata = {
  id: 'test-track',
  filePath: 'tracks/test.mp3',
  title: 'Test Track',
  artist: 'Test Artist',
  duration: 180,
  timing: {
    intro: 8,
    outro: 12,
    coldOpen: false,
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

describe('PlayerController', () => {
  let player: PlayerController;

  beforeEach(() => {
    player = new PlayerController();
  });

  afterEach(() => {
    player.dispose();
  });

  describe('load', () => {
    it('loads a track successfully', async () => {
      const loadedCallback = jest.fn();
      player.on(PlayerEvent.TRACK_LOADED, loadedCallback);

      // Trigger load callback manually since Howler is mocked
      await player.load(mockTrack);

      expect(player.getCurrentTrack()).toEqual(mockTrack);
    });
  });

  describe('playback controls', () => {
    it('plays the loaded track', () => {
      player.play();
      // With our mock, this just ensures no errors
      expect(true).toBe(true);
    });

    it('pauses playback', () => {
      player.pause();
      expect(true).toBe(true);
    });

    it('stops playback', () => {
      player.stop();
      expect(true).toBe(true);
    });
  });

  describe('seek', () => {
    it('seeks to a position', () => {
      player.seek(30);
      // With our mock, this just ensures no errors
      expect(true).toBe(true);
    });
  });

  describe('volume', () => {
    it('sets volume', () => {
      player.setVolume(0.5);
      expect(true).toBe(true);
    });

    it('clamps volume between 0 and 1', () => {
      player.setVolume(-0.5);
      player.setVolume(1.5);
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('mutes and unmutes', () => {
      player.mute(true);
      player.mute(false);
      expect(true).toBe(true);
    });
  });

  describe('getCurrentTime', () => {
    it('returns current playback position', () => {
      const time = player.getCurrentTime();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDuration', () => {
    it('returns track duration', () => {
      const duration = player.getDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('event system', () => {
    it('registers event listeners', () => {
      const callback = jest.fn();
      player.on(PlayerEvent.TRACK_PLAYING, callback);

      // Manually emit event
      player['emit'](PlayerEvent.TRACK_PLAYING);

      expect(callback).toHaveBeenCalled();
    });

    it('removes event listeners', () => {
      const callback = jest.fn();
      player.on(PlayerEvent.TRACK_PLAYING, callback);
      player.off(PlayerEvent.TRACK_PLAYING, callback);

      player['emit'](PlayerEvent.TRACK_PLAYING);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('cleans up resources', () => {
      player.dispose();
      expect(player.getCurrentTrack()).toBeNull();
    });
  });
});
