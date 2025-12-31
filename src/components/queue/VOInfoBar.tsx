'use client';

import { Badge } from '@/components/ui/badge';
import { Mic, ArrowUp } from 'lucide-react';
import type { VOSegment } from '@/types/vo';
import type { TrackMetadata } from '@/types/track';
import { getVOTimingInfo } from '@/lib/audio/timing';
import { formatDuration } from '@/lib/utils';
import { BREAK_TYPES } from '@/types/talent';

interface VOInfoBarProps {
  segment: VOSegment;
  track: TrackMetadata;
  isActive?: boolean;
  previousTrack?: TrackMetadata;
}

export function VOInfoBar({ segment, track, isActive = false, previousTrack }: VOInfoBarProps) {
  const timingInfo = getVOTimingInfo(track, segment);
  const breakTypeLabel = segment.breakType ? BREAK_TYPES[segment.breakType].label : 'VO';

  // Determine if this is a backsell (references previous track)
  const isBacksell = segment.transcript && previousTrack && (
    segment.transcript.toLowerCase().includes('that was') ||
    segment.transcript.toLowerCase().includes('just heard') ||
    segment.transcript.toLowerCase().includes(previousTrack.artist.toLowerCase()) ||
    segment.transcript.toLowerCase().includes(previousTrack.title.toLowerCase())
  );

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-start gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="text-xs flex items-center gap-1"
          >
            <Mic className="h-3 w-3" />
            {breakTypeLabel}
          </Badge>

          <span className="text-muted-foreground">
            {formatDuration(segment.duration)} @ {formatDuration(timingInfo.startOffset)}
          </span>

          {isBacksell && previousTrack && (
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
              <ArrowUp className="h-3 w-3" />
              <span className="text-xs font-medium">
                references {previousTrack.artist}
              </span>
            </div>
          )}
        </div>
      </div>

      {segment.transcript && (
        <div className="mt-1.5 text-xs text-muted-foreground italic pl-0">
          "{segment.transcript}"
        </div>
      )}
    </div>
  );
}
