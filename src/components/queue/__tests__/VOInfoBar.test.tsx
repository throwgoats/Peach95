import { render, screen } from '@testing-library/react';
import { VOInfoBar } from '../VOInfoBar';
import type { VOSegment } from '@/types/vo';
import type { TrackMetadata } from '@/types/track';

// Mock the timing utility
jest.mock('@/lib/audio/timing', () => ({
  getVOTimingInfo: jest.fn(() => ({
    startOffset: 5,
    endTime: 11,
    isValidTiming: true,
    warningMessage: null
  }))
}));

// Mock break types
jest.mock('@/types/talent', () => ({
  BREAK_TYPES: {
    short: { label: 'Short VO', minDuration: 3, maxDuration: 5 },
    backsell: { label: 'Backsell', minDuration: 5, maxDuration: 10 },
  }
}));

const mockTrack: TrackMetadata = {
  id: 'track-2',
  filePath: 'tracks/song2.mp3',
  title: 'Song Two',
  artist: 'Artist Two',
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
};

const previousTrack: TrackMetadata = {
  id: 'track-1',
  filePath: 'tracks/song1.mp3',
  title: 'Song One',
  artist: 'Artist One',
  duration: 200,
  timing: {
    intro: 8,
    outro: 10,
    coldOpen: false,
  },
  rotation: {
    category: 'B',
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

const mockVOSegment: VOSegment = {
  id: 'vo-1',
  fileUrl: 'vo/segment1.mp3',
  duration: 6,
  startOffset: 5,
  transcript: 'That was Artist One with Song One',
  generatedAt: '2025-01-01T00:00:00Z',
  persona: 'Morning Mike',
  breakType: 'backsell',
};

describe('VOInfoBar', () => {
  it('renders VO segment information', () => {
    render(<VOInfoBar segment={mockVOSegment} track={mockTrack} />);

    expect(screen.getByText('Backsell')).toBeInTheDocument();
    expect(screen.getByText(/0:06 @ 0:05/)).toBeInTheDocument();
    expect(screen.getByText('"That was Artist One with Song One"')).toBeInTheDocument();
  });

  it('shows active state when VO is playing', () => {
    render(<VOInfoBar segment={mockVOSegment} track={mockTrack} isActive={true} />);

    const badge = screen.getByText('Backsell').closest('div');
    expect(badge).toHaveClass('bg-primary');
  });

  it('detects backsell with "that was" phrase', () => {
    const backsellSegment = {
      ...mockVOSegment,
      transcript: 'That was Artist One with Song One',
    };

    render(
      <VOInfoBar
        segment={backsellSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.getByText(/references Artist One/)).toBeInTheDocument();
  });

  it('detects backsell with "just heard" phrase', () => {
    const backsellSegment = {
      ...mockVOSegment,
      transcript: 'You just heard Song One by Artist One',
    };

    render(
      <VOInfoBar
        segment={backsellSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.getByText(/references Artist One/)).toBeInTheDocument();
  });

  it('detects backsell when transcript contains previous artist name', () => {
    const backsellSegment = {
      ...mockVOSegment,
      transcript: 'Great track from Artist One on Peach 95',
    };

    render(
      <VOInfoBar
        segment={backsellSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.getByText(/references Artist One/)).toBeInTheDocument();
  });

  it('detects backsell when transcript contains previous song title', () => {
    const backsellSegment = {
      ...mockVOSegment,
      transcript: 'Song One is always a crowd favorite',
    };

    render(
      <VOInfoBar
        segment={backsellSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.getByText(/references Artist One/)).toBeInTheDocument();
  });

  it('does not show backsell indicator without previous track', () => {
    const backsellSegment = {
      ...mockVOSegment,
      transcript: 'That was Artist One with Song One',
    };

    render(
      <VOInfoBar
        segment={backsellSegment}
        track={mockTrack}
      />
    );

    expect(screen.queryByText(/references/)).not.toBeInTheDocument();
  });

  it('does not show backsell indicator for forward sell', () => {
    const forwardSellSegment = {
      ...mockVOSegment,
      transcript: 'Coming up next, a great track from Artist Two',
    };

    render(
      <VOInfoBar
        segment={forwardSellSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.queryByText(/references/)).not.toBeInTheDocument();
  });

  it('handles VO without transcript gracefully', () => {
    const noTranscriptSegment = {
      ...mockVOSegment,
      transcript: undefined,
    };

    render(
      <VOInfoBar
        segment={noTranscriptSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.queryByText(/references/)).not.toBeInTheDocument();
  });

  it('is case insensitive when detecting backsell phrases', () => {
    const mixedCaseSegment = {
      ...mockVOSegment,
      transcript: 'THAT WAS artist one with their hit song',
    };

    render(
      <VOInfoBar
        segment={mixedCaseSegment}
        track={mockTrack}
        previousTrack={previousTrack}
      />
    );

    expect(screen.getByText(/references Artist One/)).toBeInTheDocument();
  });
});
