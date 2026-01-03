'use client';

import { useState, useEffect } from 'react';
import { TrackList } from '@/components/library/TrackList';
import { TrackInfoPanel } from '@/components/library/TrackInfoPanel';
import { QueuePanel } from '@/components/queue/QueuePanel';
import { DJSelector } from '@/components/talent/DJSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DndProvider } from '@/components/providers/DndProvider';
import { useLibraryStore } from '@/stores/libraryStore';
import { getPlayerInstance } from '@/lib/audio/player';
import { RotateCw, Loader2 } from 'lucide-react';
import type { TrackMetadata } from '@/types/track';

export default function Home() {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Track selection state
  const [selectedTrack, setSelectedTrack] = useState<TrackMetadata | null>(null);

  // Library state for refresh button
  const loading = useLibraryStore((state) => state.loading);
  const loadTracks = useLibraryStore((state) => state.loadTracks);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const player = getPlayerInstance();
      player.dispose();
    };
  }, []);

  return (
    <DndProvider>
      <main className="h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8 overflow-hidden">
        <div className="h-full flex flex-col space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Peach95
            </h1>
            <p className="text-muted-foreground">
              Today's Hits and Yesterday's Favorites
            </p>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_4fr_2fr] gap-6 min-h-0">
            {/* Left Column - Library */}
            <div className="space-y-6 min-h-0 flex flex-col">
              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Track Library</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadTracks()}
                      disabled={loading}
                      className="h-8 w-8 p-0"
                      title="Refresh library"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <TrackList
                    onTrackSelect={setSelectedTrack}
                    selectedTrack={selectedTrack}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Queue */}
            <div className="space-y-6 min-h-0 flex flex-col">
              <QueuePanel />
            </div>

            {/* Right Column - DJ, Track Info */}
            <div className="space-y-6 min-h-0 flex flex-col">
              <DJSelector />
              <TrackInfoPanel
                track={selectedTrack}
                onClose={() => setSelectedTrack(null)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 text-center text-sm text-muted-foreground pt-4 space-y-2">
            <p>Peach95 Radio Automation - MVP v0.2.0</p>
            <p className="text-xs">
              Keyboard shortcuts: <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> Play/Pause ·
              <kbd className="px-2 py-1 bg-muted rounded ml-1">S</kbd> Stop ·
              <kbd className="px-2 py-1 bg-muted rounded ml-1">↑/↓</kbd> Volume
            </p>
          </div>
        </div>
      </main>
    </DndProvider>
  );
}
