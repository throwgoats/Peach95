'use client';

import { Slider } from '@/components/ui/slider';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration } from '@/lib/utils';

export function ProgressBar() {
  const position = usePlayerStore((state) => state.position);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const seek = usePlayerStore((state) => state.seek);

  const duration = currentTrack?.duration ?? 0;
  const percentage = duration > 0 ? (position / duration) * 100 : 0;

  const handleSeek = (value: number[]) => {
    const newPosition = (value[0] / 100) * duration;
    seek(newPosition);
  };

  return (
    <div className="space-y-2">
      <Slider
        value={[percentage]}
        onValueChange={handleSeek}
        max={100}
        step={0.1}
        className="cursor-pointer"
        disabled={!currentTrack}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatDuration(position)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}
