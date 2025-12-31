'use client';

import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import type { VOSegment } from '@/types/vo';
import type { TrackMetadata } from '@/types/track';
import { getVOTimingInfo } from '@/lib/audio/timing';
import { formatDuration } from '@/lib/utils';
import { BREAK_TYPES } from '@/types/talent';

interface VOInfoBarProps {
  segment: VOSegment;
  track: TrackMetadata;
  isActive?: boolean;
}

export function VOInfoBar({ segment, track, isActive = false }: VOInfoBarProps) {
  const timingInfo = getVOTimingInfo(track, segment);
  const breakTypeLabel = segment.breakType ? BREAK_TYPES[segment.breakType].label : 'VO';

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center gap-2 text-xs flex-wrap">
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

        {segment.transcript && (
          <span className="text-muted-foreground truncate flex-1">
            "{segment.transcript}"
          </span>
        )}
      </div>
    </div>
  );
}
