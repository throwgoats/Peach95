'use client';

import { useEffect } from 'react';
import { TrackCard } from './TrackCard';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function TrackList() {
  const tracks = useLibraryStore((state) => state.tracks);
  const loading = useLibraryStore((state) => state.loading);
  const error = useLibraryStore((state) => state.error);
  const loadTracks = useLibraryStore((state) => state.loadTracks);
  const loadTrack = usePlayerStore((state) => state.loadTrack);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleTrackClick = (track: any) => {
    loadTrack(track);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading tracks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p className="font-semibold">Error loading tracks</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <p className="text-center text-muted-foreground">
            No tracks found in library
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        {tracks.length} tracks in library
      </div>
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onClick={() => handleTrackClick(track)}
        />
      ))}
    </div>
  );
}
