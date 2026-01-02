'use client';

import { useEffect } from 'react';
import { TrackCard } from './TrackCard';
import { useLibraryStore } from '@/stores/libraryStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpDown } from 'lucide-react';
import type { TrackMetadata } from '@/types/track';

interface TrackListProps {
  onTrackSelect: (track: TrackMetadata) => void;
  selectedTrack: TrackMetadata | null;
}

export function TrackList({ onTrackSelect, selectedTrack }: TrackListProps) {
  const loading = useLibraryStore((state) => state.loading);
  const error = useLibraryStore((state) => state.error);
  const loadTracks = useLibraryStore((state) => state.loadTracks);
  const getFilteredTracks = useLibraryStore((state) => state.getFilteredTracks);
  const sortBy = useLibraryStore((state) => state.sortBy);
  const sortOrder = useLibraryStore((state) => state.sortOrder);
  const setSortBy = useLibraryStore((state) => state.setSortBy);
  const setSortOrder = useLibraryStore((state) => state.setSortOrder);

  const tracks = getFilteredTracks();

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleTrackClick = (track: TrackMetadata) => {
    onTrackSelect(track);
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
      {/* Sorting Controls */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant={sortBy === 'title' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('title')}
            className="h-8 text-xs"
          >
            Title
          </Button>
          <Button
            variant={sortBy === 'artist' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('artist')}
            className="h-8 text-xs"
          >
            Artist
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="h-8 w-8 p-0"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          {tracks.length} tracks
        </div>
      </div>

      {/* Track List */}
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onClick={() => handleTrackClick(track)}
          isSelected={selectedTrack?.id === track.id}
        />
      ))}
    </div>
  );
}
