'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayerStore } from '@/stores/playerStore';

export function VolumeControl() {
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);

  const displayVolume = muted ? 0 : volume * 100;

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleMute}
        className="flex-shrink-0"
      >
        {muted || volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <Slider
        value={[displayVolume]}
        onValueChange={handleVolumeChange}
        max={100}
        step={1}
        className="flex-1 cursor-pointer"
      />
      <span className="text-sm text-muted-foreground w-10 text-right">
        {Math.round(displayVolume)}%
      </span>
    </div>
  );
}
