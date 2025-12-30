'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TrackMetadata } from '@/types/track';
import { formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { GripVertical, X, Play } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QueueItemProps {
  track: TrackMetadata;
  index: number;
  position: number;
}

export function QueueItem({ track, index, position }: QueueItemProps) {
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const playFromQueue = usePlayerStore((state) => state.playFromQueue);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id + '-' + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const positionLabel = position === 1 ? 'Next' : position.toString();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="transition-all hover:shadow-md"
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Position Badge */}
          <div className="flex-shrink-0 w-12 text-center">
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                position === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {positionLabel}
            </span>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{track.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {track.artist}
            </p>
          </div>

          {/* Duration */}
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {formatDuration(track.duration)}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => playFromQueue(index)}
              className="h-8 w-8 p-0"
              title="Play now"
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeFromQueue(index)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Remove from queue"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
