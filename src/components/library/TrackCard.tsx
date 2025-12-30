'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { TrackMetadata } from '@/types/track';
import { formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { Music } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface TrackCardProps {
  track: TrackMetadata;
  onClick: () => void;
  isSelected?: boolean;
}

const categoryColors = {
  A: 'bg-red-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-yellow-500',
};

export function TrackCard({ track, onClick, isSelected = false }: TrackCardProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isCurrentTrack = currentTrack?.id === track.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `library-${track.id}`,
      data: {
        track,
      },
    });

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click during drag
    if (isDragging) {
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <Card
      ref={setNodeRef}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isCurrentTrack ? 'ring-2 ring-primary bg-accent' : ''
      } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''} ${
        isDragging ? 'opacity-0' : ''
      }`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon or Category Badge */}
          <div
            className={`w-10 h-10 rounded flex items-center justify-center text-white flex-shrink-0 ${
              categoryColors[track.rotation.category]
            }`}
          >
            {isCurrentTrack ? (
              <Music className="h-5 w-5" />
            ) : (
              <span className="font-bold">{track.rotation.category}</span>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{track.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {track.artist}
            </p>
          </div>

          {/* Duration */}
          <div className="text-sm text-muted-foreground flex-shrink-0">
            {formatDuration(track.duration)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
