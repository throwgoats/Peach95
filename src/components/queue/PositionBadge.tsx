'use client';

import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: number;
  hasVO: boolean;
  isPlaying: boolean;
}

export function PositionBadge({ position, hasVO, isPlaying }: PositionBadgeProps) {
  // Determine label:
  // - If currently playing: "Playing"
  // - If first in queue (position 1) and not playing: "Next"
  // - Otherwise: show position number
  let label: string;
  if (isPlaying) {
    label = 'Playing';
  } else if (position === 1) {
    label = 'Next';
  } else {
    // For positions 2+, show as 2, 3, 4... (not 1, 2, 3...)
    label = position.toString();
  }

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
