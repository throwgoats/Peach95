'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { getPlayerInstance } from '@/lib/audio/player';

interface QueueItemControlsProps {
  position: number;
  isPlaying: boolean;
  isPaused: boolean;
}

export function QueueItemControls({
  position,
  isPlaying,
  isPaused
}: QueueItemControlsProps) {
  const loadAndPlayQueueItem = usePlayerStore(state => state.loadAndPlayQueueItem);
  const player = getPlayerInstance();

  const handlePlayPause = async () => {
    if (isPlaying && !isPaused) {
      player.pauseAll();
    } else if (isPaused) {
      player.playWithSync();
    } else {
      await loadAndPlayQueueItem(position);
    }
  };

  const handleStop = () => {
    player.stopAll();
  };

  return (
    <div className="flex gap-1 flex-shrink-0">
      <Button
        size="sm"
        variant={isPlaying && !isPaused ? "default" : "ghost"}
        onClick={handlePlayPause}
        className="h-8 w-8 p-0"
        title={isPlaying && !isPaused ? "Pause" : "Play"}
      >
        {isPlaying && !isPaused ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      {isPlaying && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStop}
          className="h-8 w-8 p-0"
          title="Stop"
        >
          <Square className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
