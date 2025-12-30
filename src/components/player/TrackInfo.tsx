'use client';

import { Card, CardContent } from '@/components/ui/card';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration } from '@/lib/utils';
import { Music } from 'lucide-react';

const categoryColors = {
  A: 'bg-red-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-yellow-500',
};

const playbackStateLabels = {
  playing: 'Playing',
  paused: 'Paused',
  stopped: 'Stopped',
  loading: 'Loading...',
};

export function TrackInfo() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const playbackState = usePlayerStore((state) => state.playbackState);

  if (!currentTrack) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center text-muted-foreground">
            <Music className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No track loaded</p>
            <p className="text-sm">Select a track from the library to begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                playbackState === 'playing'
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {playbackStateLabels[playbackState]}
            </span>
          </div>

          {/* Track Title */}
          <h2 className="text-3xl font-bold">{currentTrack.title}</h2>

          {/* Artist */}
          <p className="text-xl text-muted-foreground">{currentTrack.artist}</p>

          {/* Album (if available) */}
          {currentTrack.album && (
            <p className="text-sm text-muted-foreground">
              Album: {currentTrack.album}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-sm">
            {/* Category Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${
                  categoryColors[currentTrack.rotation.category]
                }`}
              >
                {currentTrack.rotation.category}
              </div>
              <span className="text-muted-foreground">Category</span>
            </div>

            {/* Duration */}
            <div className="text-muted-foreground">
              Duration: {formatDuration(currentTrack.duration)}
            </div>

            {/* Energy */}
            <div className="text-muted-foreground">
              Energy: {'⚡'.repeat(currentTrack.rotation.energy)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
