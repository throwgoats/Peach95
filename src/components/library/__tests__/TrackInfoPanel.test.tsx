import { render, screen, fireEvent } from '@testing-library/react';
import { TrackInfoPanel } from '../TrackInfoPanel';
import { usePlayerStore } from '@/stores/playerStore';
import type { TrackMetadata } from '@/types/track';

// Mock the player store
jest.mock('@/stores/playerStore');

const mockAddToQueue = jest.fn();
const mockLoadTrack = jest.fn();

const mockTrack: TrackMetadata = {
  id: 'test-track',
  filePath: 'tracks/test.mp3',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  year: 2024,
  genre: 'Pop',
  duration: 180,
  bitrate: 320,
  sampleRate: 44100,
  timing: {
    intro: 8,
    outro: 12,
    coldOpen: false,
  },
  rotation: {
    category: 'A',
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

describe('TrackInfoPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        addToQueue: mockAddToQueue,
        loadTrack: mockLoadTrack,
      };
      return selector(state);
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no track is provided', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={null} onClose={mockOnClose} />);

      expect(screen.getByText('Select a track from the library to view details')).toBeInTheDocument();
      expect(screen.queryByText('Track Info')).not.toBeInTheDocument();
    });
  });

  describe('Track Display', () => {
    it('displays all track metadata correctly', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      // Check header
      expect(screen.getByText('Track Info')).toBeInTheDocument();

      // Check track details
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument(); // Duration formatted
    });

    it('displays category badge with correct category', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Current Hits')).toBeInTheDocument();
    });

    it('displays correct category for B tracks', () => {
      const mockOnClose = jest.fn();
      const trackB = { ...mockTrack, rotation: { ...mockTrack.rotation, category: 'B' as const } };
      render(<TrackInfoPanel track={trackB} onClose={mockOnClose} />);

      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('Recurrents')).toBeInTheDocument();
    });

    it('displays correct category for C tracks', () => {
      const mockOnClose = jest.fn();
      const trackC = { ...mockTrack, rotation: { ...mockTrack.rotation, category: 'C' as const } };
      render(<TrackInfoPanel track={trackC} onClose={mockOnClose} />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
    });

    it('displays correct category for D tracks', () => {
      const mockOnClose = jest.fn();
      const trackD = { ...mockTrack, rotation: { ...mockTrack.rotation, category: 'D' as const } };
      render(<TrackInfoPanel track={trackD} onClose={mockOnClose} />);

      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('Deep Cuts')).toBeInTheDocument();
    });
  });

  describe('Rotation Properties', () => {
    it('does not display frequency property (which does not exist)', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      // Ensure the frequency text is NOT present
      expect(screen.queryByText(/Rotation: Every/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/hours/i)).not.toBeInTheDocument();
    });

    it('renders without errors when rotation object has only valid properties', () => {
      const mockOnClose = jest.fn();
      const trackWithValidRotation = {
        ...mockTrack,
        rotation: {
          category: 'A' as const,
          energy: 3,
          playCount: 10,
          lastPlayed: '2025-01-01T00:00:00Z',
          addedDate: '2025-01-01T00:00:00Z',
        },
      };

      const { container } = render(<TrackInfoPanel track={trackWithValidRotation} onClose={mockOnClose} />);
      expect(container).toBeTruthy();
      expect(screen.getByText('Current Hits')).toBeInTheDocument();
    });

    it('handles all valid energy levels', () => {
      const mockOnClose = jest.fn();
      const energyLevels = [1, 2, 3, 4, 5] as const;

      energyLevels.forEach((energy) => {
        const trackWithEnergy = {
          ...mockTrack,
          rotation: { ...mockTrack.rotation, energy },
        };
        const { unmount } = render(<TrackInfoPanel track={trackWithEnergy} onClose={mockOnClose} />);
        expect(screen.getByText('Current Hits')).toBeInTheDocument();
        unmount();
      });
    });

    it('handles null lastPlayed', () => {
      const mockOnClose = jest.fn();
      const trackWithNullLastPlayed = {
        ...mockTrack,
        rotation: { ...mockTrack.rotation, lastPlayed: null },
      };

      const { container } = render(<TrackInfoPanel track={trackWithNullLastPlayed} onClose={mockOnClose} />);
      expect(container).toBeTruthy();
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('adds track to queue at front and closes when Play Next is clicked', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      const playNextButton = screen.getByRole('button', { name: /Play Next/i });
      fireEvent.click(playNextButton);

      expect(mockAddToQueue).toHaveBeenCalledWith(mockTrack, 0);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('adds track to queue at end and closes when Add to Queue is clicked', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      const addToQueueButton = screen.getByRole('button', { name: /Add to Queue/i });
      fireEvent.click(addToQueueButton);

      expect(mockAddToQueue).toHaveBeenCalledWith(mockTrack);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('loads track and closes when Load Now is clicked', () => {
      const mockOnClose = jest.fn();
      render(<TrackInfoPanel track={mockTrack} onClose={mockOnClose} />);

      const loadNowButton = screen.getByRole('button', { name: /Load Now/i });
      fireEvent.click(loadNowButton);

      expect(mockLoadTrack).toHaveBeenCalledWith(mockTrack);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Optional Fields', () => {
    it('handles track with missing optional fields', () => {
      const mockOnClose = jest.fn();
      const minimalTrack: TrackMetadata = {
        id: 'minimal-track',
        filePath: 'tracks/minimal.mp3',
        title: 'Minimal Song',
        artist: 'Minimal Artist',
        duration: 120,
        timing: {
          intro: 0,
          outro: 0,
          coldOpen: false,
        },
        rotation: {
          category: 'B',
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

      render(<TrackInfoPanel track={minimalTrack} onClose={mockOnClose} />);

      expect(screen.getByText('Minimal Song')).toBeInTheDocument();
      expect(screen.getByText('Minimal Artist')).toBeInTheDocument();
      expect(screen.getByText('Recurrents')).toBeInTheDocument();
    });
  });
});
