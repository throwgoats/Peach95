'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration } from '@/lib/utils';
import { Music } from 'lucide-react';
import { PlayerControls } from './PlayerControls';
import { VolumeControl } from './VolumeControl';

const categoryColors = {
  A: 'bg-red-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-yellow-500',
};

export function TrackInfo() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const playbackState = usePlayerStore((state) => state.playbackState);
  const position = usePlayerStore((state) => state.position);

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

  const isPlaying = playbackState === 'playing';
  const progress = currentTrack ? (position / currentTrack.duration) * 100 : 0;

  return (
    <Card className="relative overflow-hidden w-full">
      {/* Background Progress Bar */}
      {isPlaying && (
        <div
          className="absolute inset-0 bg-primary/20 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <CardContent className="relative p-3">
        {/* Now Playing Label */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Now Playing
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Track Info - Takes up most space */}
          <div className="flex-1 min-w-0">
            {/* Title & Artist */}
            <h2 className="text-xl font-bold truncate mb-0.5">{currentTrack.title}</h2>
            <p className="text-base text-muted-foreground truncate mb-2">{currentTrack.artist}</p>

            {/* Metadata Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Badge */}
              <Badge
                className={`text-white ${
                  categoryColors[currentTrack.rotation.category]
                }`}
              >
                {currentTrack.rotation.category}
              </Badge>

              {/* Duration */}
              <span className="text-xs text-muted-foreground">
                {formatDuration(position)} / {formatDuration(currentTrack.duration)}
              </span>

              {/* Energy */}
              <span className="text-xs text-muted-foreground">
                {'⚡'.repeat(currentTrack.rotation.energy)}
              </span>

              {/* Album (if available) */}
              {currentTrack.album && (
                <span className="text-xs text-muted-foreground truncate">
                  {currentTrack.album}
                </span>
              )}
            </div>
          </div>

          {/* Controls - Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <PlayerControls />
            <div className="w-px h-8 bg-border" />
            <VolumeControl />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
