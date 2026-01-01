'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Play, ListPlus, X } from 'lucide-react';
import type { TrackMetadata } from '@/types/track';
import { formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';

interface TrackInfoPanelProps {
  track: TrackMetadata | null;
  onClose: () => void;
}

const categoryColors = {
  A: 'bg-red-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-yellow-500',
};

const categoryNames = {
  A: 'Current Hits',
  B: 'Recurrents',
  C: 'Gold',
  D: 'Deep Cuts',
};

export function TrackInfoPanel({ track, onClose }: TrackInfoPanelProps) {
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const loadTrack = usePlayerStore((state) => state.loadTrack);

  if (!track) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Select a track from the library to view details
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePlayNext = () => {
    addToQueue(track, 0); // Add to front of queue
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(track); // Add to end of queue
    onClose();
  };

  const handleLoadNow = () => {
    loadTrack(track);
    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Track Info
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`w-16 h-16 rounded flex items-center justify-center text-white ${
              categoryColors[track.rotation.category]
            }`}
          >
            <span className="font-bold text-2xl">{track.rotation.category}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {categoryNames[track.rotation.category]}
            </div>
          </div>
        </div>

        {/* Track Details */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{track.title}</h3>
              {track.timing.coldOpen && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" title="Cold Open - track starts a segment">
                  Cold Open
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{track.artist}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(track.duration)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Album:</span>
              <span className="ml-2 font-medium">{track.album}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Year:</span>
              <span className="ml-2 font-medium">{track.year}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Genre:</span>
              <span className="ml-2 font-medium">{track.genre}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            className="w-full"
            size="lg"
            onClick={handlePlayNext}
          >
            <Play className="h-4 w-4 mr-2" />
            Play Next
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleAddToQueue}
            >
              <ListPlus className="h-4 w-4 mr-2" />
              Add to Queue
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadNow}
            >
              <Play className="h-4 w-4 mr-2" />
              Load Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
