import { render, screen } from '@testing-library/react';
import { TrackInfo } from '../TrackInfo';
import { usePlayerStore } from '@/stores/playerStore';
import type { TrackMetadata } from '@/types/track';

// Mock the player store
jest.mock('@/stores/playerStore');

const mockTrack: TrackMetadata = {
  id: 'test-track',
  filePath: 'tracks/test.mp3',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  timing: {
    intro: 8,
    outro: 12,
    coldOpen: false,
    coldOut: false,
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
};

describe('TrackInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "No track loaded" when no track is selected', () => {
    (usePlayerStore as unknown as jest.Mock).mockReturnValue(null);

    render(<TrackInfo />);

    expect(screen.getByText('No track loaded')).toBeInTheDocument();
    expect(screen.getByText('Select a track from the library to begin')).toBeInTheDocument();
  });

  it('displays track information when track is loaded', () => {
    (usePlayerStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentTrack: mockTrack,
        playbackState: 'stopped' as const,
      };
      return selector(state);
    });

    render(<TrackInfo />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Album: Test Album')).toBeInTheDocument();
  });

  it('displays category badge', () => {
    (usePlayerStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentTrack: mockTrack,
        playbackState: 'stopped' as const,
      };
      return selector(state);
    });

    render(<TrackInfo />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('displays correct playback state', () => {
    (usePlayerStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentTrack: mockTrack,
        playbackState: 'playing' as const,
      };
      return selector(state);
    });

    render(<TrackInfo />);

    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('shows energy level', () => {
    (usePlayerStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentTrack: mockTrack,
        playbackState: 'stopped' as const,
      };
      return selector(state);
    });

    render(<TrackInfo />);

    // Energy 4 should show 4 lightning bolts
    expect(screen.getByText(/Energy:/)).toBeInTheDocument();
  });
});
