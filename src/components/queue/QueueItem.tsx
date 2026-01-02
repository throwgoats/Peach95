'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { QueueItem as QueueItemType } from '@/types/queue';
import type { TrackMetadata } from '@/types/track';
import { formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QueueItemControls } from './QueueItemControls';
import { VOInfoBar } from './VOInfoBar';
import { PositionBadge } from './PositionBadge';
import { EnergyMeter } from './EnergyMeter';

interface QueueItemProps {
  queueItem: QueueItemType;
  index: number;
  position: number;
  previousTrack?: TrackMetadata;
}

export function QueueItem({ queueItem, index, position, previousTrack }: QueueItemProps) {
  const { track, voSegment } = queueItem;
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const playbackState = usePlayerStore(
    (state) => state.queueItemStates.get(index)
  );

  const isTopTwo = position <= 2;
  const isCurrentlyPlaying = playbackState?.isPlaying ?? false;
  const isPaused = playbackState?.isPaused ?? false;

  // Calculate progress percentage
  const progress =
    isCurrentlyPlaying && playbackState
      ? (playbackState.primaryPosition / track.duration) * 100
      : 0;

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

  // Check if this item has a VO that references the previous track
  const hasBacksellReference = voSegment && previousTrack && voSegment.transcript && (
    voSegment.transcript.toLowerCase().includes('that was') ||
    voSegment.transcript.toLowerCase().includes('just heard') ||
    voSegment.transcript.toLowerCase().includes(previousTrack.artist.toLowerCase()) ||
    voSegment.transcript.toLowerCase().includes(previousTrack.title.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Visual connection line to previous track when backselling */}
      {hasBacksellReference && (
        <div className="absolute -top-2 left-8 w-px h-2 bg-blue-500/50 dark:bg-blue-400/50" />
      )}

      <Card
        ref={setNodeRef}
        style={style}
        className={`relative overflow-hidden transition-all hover:shadow-md ${
          isCurrentlyPlaying ? 'shadow-lg border-primary/50' : ''
        } ${
          hasBacksellReference ? 'border-l-2 border-l-blue-500/30 dark:border-l-blue-400/30' : ''
        }`}
      >
        {/* Background Progress Bar */}
        {isCurrentlyPlaying && (
          <div
            className="absolute inset-0 bg-primary/20 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}

        <CardContent className="relative p-3">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Position Badge with VO indicator */}
            <PositionBadge
              position={position}
              hasVO={!!voSegment}
              isPlaying={isCurrentlyPlaying}
            />

            {/* Category Badge */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold bg-muted text-muted-foreground">
                {track.rotation.category}
              </span>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{track.title}</h4>
                {track.timing.coldOpen && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 flex-shrink-0" title="Cold Open - track starts a segment">
                    Cold Open
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>

            {/* Right side controls group */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {/* Top row: Duration/Time and Controls */}
              <div className="flex items-center gap-2">
                {/* Duration / Current Time */}
                <div className="text-xs text-muted-foreground">
                  {isCurrentlyPlaying && playbackState ? (
                    <>
                      {formatDuration(playbackState.primaryPosition)} /{' '}
                      {formatDuration(track.duration)}
                    </>
                  ) : (
                    formatDuration(track.duration)
                  )}
                </div>

                {/* Playback Controls (Top 2 only) */}
                {isTopTwo && (
                  <QueueItemControls
                    position={index}
                    isPlaying={isCurrentlyPlaying}
                    isPaused={isPaused}
                  />
                )}
              </div>

              {/* Bottom row: Energy Meter */}
              <EnergyMeter energy={track.rotation.energy} compact />
            </div>

            {/* Remove Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeFromQueue(index)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
              title="Remove from queue"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* VO Info Bar */}
          {voSegment && (
            <VOInfoBar
              segment={voSegment}
              track={track}
              isActive={playbackState?.secondaryPosition !== undefined}
              previousTrack={previousTrack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
