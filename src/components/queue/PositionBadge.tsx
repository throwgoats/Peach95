'use client';

import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: number;
  hasVO: boolean;
  isPlaying: boolean;
}

export function PositionBadge({ position, hasVO, isPlaying }: PositionBadgeProps) {
  // If playing, show "Playing", otherwise show "Next" for position 1, or the position number
  const label = isPlaying ? 'Playing' : (position === 1 ? 'Next' : position.toString());

  return (
    <div className="flex-shrink-0 w-16 text-center relative">
      <span
        className={cn(
          "text-xs font-medium px-2 py-1 rounded inline-block transition-all",
          isPlaying && "ring-2 ring-primary ring-offset-1 animate-pulse bg-primary text-primary-foreground",
          !isPlaying && position === 1 && "bg-primary text-primary-foreground",
          !isPlaying && position !== 1 && "bg-muted text-muted-foreground"
        )}
      >
        {label}
      </span>

      {hasVO && (
        <div className="absolute -top-1 -right-1">
          <div className="h-2 w-2 bg-green-500 rounded-full border border-background" />
        </div>
      )}
    </div>
  );
}
