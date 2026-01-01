import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueueItem } from '../QueueItem';
import type { QueueItem as QueueItemType } from '@/types/queue';
import type { TrackMetadata } from '@/types/track';
import type { VOSegment } from '@/types/vo';

// Mock the store
const mockRemoveFromQueue = jest.fn();
const mockGetPlaybackState = jest.fn(() => undefined);

jest.mock('@/stores/playerStore', () => ({
  usePlayerStore: (selector: (state: any) => any) => {
    const state = {
      removeFromQueue: mockRemoveFromQueue,
      queueItemStates: new Map(),
    };
    return selector(state);
  },
}));

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

// Mock child components
jest.mock('../QueueItemControls', () => ({
  QueueItemControls: ({ position, isPlaying, isPaused }: any) => (
    <div data-testid="queue-item-controls" data-position={position} data-playing={isPlaying} data-paused={isPaused}>
      Controls
    </div>
  ),
}));

jest.mock('../VOInfoBar', () => ({
  VOInfoBar: ({ segment, track, isActive, previousTrack }: any) => (
    <div data-testid="vo-info-bar" data-active={isActive}>
      VO: {segment.transcript}
    </div>
  ),
}));

jest.mock('../PositionBadge', () => ({
  PositionBadge: ({ position, hasVO, isPlaying }: any) => (
    <div data-testid="position-badge" data-position={position} data-has-vo={hasVO} data-playing={isPlaying}>
      {position}
    </div>
  ),
}));

const createMockTrack = (overrides?: Partial<TrackMetadata>): TrackMetadata => ({
  id: 'track-1',
  filePath: 'tracks/song1.mp3',
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

const createMockQueueItem = (trackOverrides?: Partial<TrackMetadata>, voSegment?: VOSegment): QueueItemType => ({
  track: createMockTrack(trackOverrides),
  voSegment,
  queuePosition: 0,
  addedAt: '2025-01-01T00:00:00Z',
});

const mockVOSegment: VOSegment = {
  id: 'vo-1',
  fileUrl: 'vo/segment1.mp3',
  duration: 6,
  startOffset: 5,
  transcript: 'Great music on Peach 95',
  generatedAt: '2025-01-01T00:00:00Z',
  persona: 'Morning Mike',
  breakType: 'short',
};

describe('QueueItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cold Open Badge', () => {
    it('shows cold open badge when track has coldOpen: true', () => {
      const queueItem = createMockQueueItem({ timing: { intro: 0, outro: 12, coldOpen: true } });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const badge = screen.getByText('Cold Open');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
      expect(badge).toHaveAttribute('title', 'Cold Open - track starts a segment');
    });

    it('does not show cold open badge when track has coldOpen: false', () => {
      const queueItem = createMockQueueItem({ timing: { intro: 10, outro: 12, coldOpen: false } });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.queryByText('Cold Open')).not.toBeInTheDocument();
    });

    it('cold open badge has dark mode styles', () => {
      const queueItem = createMockQueueItem({ timing: { intro: 0, outro: 12, coldOpen: true } });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const badge = screen.getByText('Cold Open');
      expect(badge).toHaveClass('dark:bg-orange-900/30', 'dark:text-orange-400');
    });

    it('cold open badge does not wrap and maintains sizing', () => {
      const queueItem = createMockQueueItem({ timing: { intro: 0, outro: 12, coldOpen: true } });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const badge = screen.getByText('Cold Open');
      expect(badge).toHaveClass('flex-shrink-0');
    });
  });

  describe('Backsell Visual Connection', () => {
    it('shows visual connection line when VO references previous track', () => {
      const previousTrack = createMockTrack({ id: 'prev-track', artist: 'Previous Artist', title: 'Previous Song' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'That was Previous Artist with Previous Song',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      const connectionLine = container.querySelector('.absolute.-top-2.left-8');
      expect(connectionLine).toBeInTheDocument();
      expect(connectionLine).toHaveClass('bg-blue-500/50', 'dark:bg-blue-400/50');
    });

    it('shows border highlight when VO has backsell reference', () => {
      const previousTrack = createMockTrack({ id: 'prev-track', artist: 'Previous Artist', title: 'Previous Song' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'That was Previous Artist',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      const card = container.querySelector('.border-l-2');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border-l-blue-500/30', 'dark:border-l-blue-400/30');
    });

    it('does not show visual connection without previous track', () => {
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'That was some great music',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={0} position={1} />
      );

      const connectionLine = container.querySelector('.absolute.-top-2.left-8');
      expect(connectionLine).not.toBeInTheDocument();
    });

    it('detects backsell with "that was" phrase', () => {
      const previousTrack = createMockTrack({ id: 'prev', artist: 'Artist', title: 'Song' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'That was a great track',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      expect(container.querySelector('.border-l-2')).toBeInTheDocument();
    });

    it('detects backsell with "just heard" phrase', () => {
      const previousTrack = createMockTrack({ id: 'prev', artist: 'Artist', title: 'Song' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'You just heard a classic',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      expect(container.querySelector('.border-l-2')).toBeInTheDocument();
    });

    it('detects backsell when transcript contains previous artist name', () => {
      const previousTrack = createMockTrack({ id: 'prev', artist: 'Madonna', title: 'Like A Prayer' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'Madonna always brings the hits',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      expect(container.querySelector('.border-l-2')).toBeInTheDocument();
    });

    it('detects backsell when transcript contains previous song title', () => {
      const previousTrack = createMockTrack({ id: 'prev', artist: 'Artist', title: 'Thriller' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'Thriller is always a crowd favorite',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      expect(container.querySelector('.border-l-2')).toBeInTheDocument();
    });

    it('is case insensitive when detecting backsell', () => {
      const previousTrack = createMockTrack({ id: 'prev', artist: 'The Beatles', title: 'Hey Jude' });
      const backsellVO = {
        ...mockVOSegment,
        transcript: 'THAT WAS the beatles',
      };
      const queueItem = createMockQueueItem({}, backsellVO);

      const { container } = render(
        <QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />
      );

      expect(container.querySelector('.border-l-2')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('does not show progress bar when not playing', () => {
      const queueItem = createMockQueueItem();
      const { container } = render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const progressBar = container.querySelector('.bg-primary\\/20');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('shows progress bar when playing', () => {
      // Mock playback state
      jest.requireMock('@/stores/playerStore').usePlayerStore = (selector: (state: any) => any) => {
        const state = {
          removeFromQueue: mockRemoveFromQueue,
          queueItemStates: new Map([[0, { isPlaying: true, primaryPosition: 30, isPaused: false }]]),
        };
        return selector(state);
      };

      const queueItem = createMockQueueItem();
      const { container } = render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const progressBar = container.querySelector('.bg-primary\\/20');
      expect(progressBar).toBeInTheDocument();
    });

    it('calculates progress percentage correctly', () => {
      jest.requireMock('@/stores/playerStore').usePlayerStore = (selector: (state: any) => any) => {
        const state = {
          removeFromQueue: mockRemoveFromQueue,
          queueItemStates: new Map([[0, { isPlaying: true, primaryPosition: 90, isPaused: false }]]), // 90 seconds of 180 = 50%
        };
        return selector(state);
      };

      const queueItem = createMockQueueItem({ duration: 180 });
      const { container } = render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const progressBar = container.querySelector('.bg-primary\\/20') as HTMLElement;
      expect(progressBar).toHaveStyle({ width: '50%' });
    });
  });

  describe('Controls Visibility', () => {
    it('shows controls for position 1', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.getByTestId('queue-item-controls')).toBeInTheDocument();
    });

    it('shows controls for position 2', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={1} position={2} />);

      expect(screen.getByTestId('queue-item-controls')).toBeInTheDocument();
    });

    it('does not show controls for position 3', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={2} position={3} />);

      expect(screen.queryByTestId('queue-item-controls')).not.toBeInTheDocument();
    });

    it('does not show controls for position 4 and beyond', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={3} position={4} />);

      expect(screen.queryByTestId('queue-item-controls')).not.toBeInTheDocument();
    });
  });

  describe('VO Info Display', () => {
    it('shows VO info bar when VO segment is present', () => {
      const queueItem = createMockQueueItem({}, mockVOSegment);
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.getByTestId('vo-info-bar')).toBeInTheDocument();
    });

    it('does not show VO info bar when no VO segment', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.queryByTestId('vo-info-bar')).not.toBeInTheDocument();
    });

    it('passes previousTrack to VO info bar for backsell detection', () => {
      const previousTrack = createMockTrack({ id: 'prev' });
      const queueItem = createMockQueueItem({}, mockVOSegment);
      render(<QueueItem queueItem={queueItem} index={1} position={2} previousTrack={previousTrack} />);

      const voInfoBar = screen.getByTestId('vo-info-bar');
      expect(voInfoBar).toBeInTheDocument();
    });
  });

  describe('Remove Button', () => {
    it('calls removeFromQueue when clicked', async () => {
      const user = userEvent.setup();
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={2} position={3} />);

      const removeButton = screen.getByTitle('Remove from queue');
      await user.click(removeButton);

      expect(mockRemoveFromQueue).toHaveBeenCalledWith(2);
    });
  });

  describe('Track Information Display', () => {
    it('displays track title and artist', () => {
      const queueItem = createMockQueueItem({ title: 'Bohemian Rhapsody', artist: 'Queen' });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
    });

    it('displays track duration when not playing', () => {
      // Reset the mock to not playing state
      jest.requireMock('@/stores/playerStore').usePlayerStore = (selector: (state: any) => any) => {
        const state = {
          removeFromQueue: mockRemoveFromQueue,
          queueItemStates: new Map(),
        };
        return selector(state);
      };

      const queueItem = createMockQueueItem({ duration: 354 }); // 5:54
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.getByText('5:54')).toBeInTheDocument();
    });

    it('displays current time and duration when playing', () => {
      jest.requireMock('@/stores/playerStore').usePlayerStore = (selector: (state: any) => any) => {
        const state = {
          removeFromQueue: mockRemoveFromQueue,
          queueItemStates: new Map([[0, { isPlaying: true, primaryPosition: 120, isPaused: false }]]),
        };
        return selector(state);
      };

      const queueItem = createMockQueueItem({ duration: 180 });
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      expect(screen.getByText(/2:00/)).toBeInTheDocument(); // Current position
      expect(screen.getByText(/3:00/)).toBeInTheDocument(); // Total duration
    });
  });

  describe('Position Badge Integration', () => {
    it('passes correct props to PositionBadge', () => {
      const queueItem = createMockQueueItem({}, mockVOSegment);
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const badge = screen.getByTestId('position-badge');
      expect(badge).toHaveAttribute('data-position', '1');
      expect(badge).toHaveAttribute('data-has-vo', 'true');
    });

    it('indicates when VO is not present', () => {
      const queueItem = createMockQueueItem();
      render(<QueueItem queueItem={queueItem} index={0} position={1} />);

      const badge = screen.getByTestId('position-badge');
      expect(badge).toHaveAttribute('data-has-vo', 'false');
    });
  });
});
