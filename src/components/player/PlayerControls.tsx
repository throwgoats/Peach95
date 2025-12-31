'use client';

import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/playerStore';

export function PlayerControls() {
  const playbackState = usePlayerStore((state) => state.playbackState);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const stop = usePlayerStore((state) => state.stop);
  const playNext = usePlayerStore((state) => state.playNext);
  const queueItems = usePlayerStore((state) => state.queueItems);

  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const hasTrack = usePlayerStore((state) => state.currentTrack !== null);
  const hasQueue = queueItems.length > 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="lg"
        onClick={handlePlayPause}
        disabled={!hasTrack || isLoading}
        className="w-16 h-16 rounded-full"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-1" />
        )}
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={stop}
        disabled={!hasTrack || isLoading}
        className="w-16 h-16 rounded-full"
      >
        <Square className="h-6 w-6" />
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={playNext}
        disabled={!hasQueue || isLoading}
        className="w-16 h-16 rounded-full"
        title="Skip to next track in queue"
      >
        <SkipForward className="h-6 w-6" />
      </Button>
    </div>
  );
}
