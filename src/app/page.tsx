'use client';

import { useState } from 'react';
import { TrackInfo } from '@/components/player/TrackInfo';
import { TrackList } from '@/components/library/TrackList';
import { TrackInfoPanel } from '@/components/library/TrackInfoPanel';
import { QueuePanel } from '@/components/queue/QueuePanel';
import { DJSelector } from '@/components/talent/DJSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DndProvider } from '@/components/providers/DndProvider';
import type { TrackMetadata } from '@/types/track';

export default function Home() {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Track selection state
  const [selectedTrack, setSelectedTrack] = useState<TrackMetadata | null>(null);

  return (
    <DndProvider>
      <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Peach95
            </h1>
            <p className="text-muted-foreground">
              Today's Hits and Yesterday's Favorites
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Main Content Column - Player and Queue */}
            <div className="space-y-6">
              <TrackInfo />
              <QueuePanel />
            </div>

            {/* Sidebar Column - DJ, Track Info, Library */}
            <div className="space-y-6">
              <DJSelector />
              <TrackInfoPanel
                track={selectedTrack}
                onClose={() => setSelectedTrack(null)}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Track Library</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <TrackList
                    onTrackSelect={setSelectedTrack}
                    selectedTrack={selectedTrack}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 pb-8 space-y-2">
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
