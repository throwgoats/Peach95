'use client';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { TrackMetadata } from '@/types/track';
import { usePlayerStore } from '@/stores/playerStore';
import { Card, CardContent } from '@/components/ui/card';

interface DndProviderProps {
  children: React.ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const [activeTrack, setActiveTrack] = useState<TrackMetadata | null>(null);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const track = event.active.data.current?.track as TrackMetadata;
    if (track) {
      setActiveTrack(track);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'queue-drop-zone') {
      const track = active.data.current?.track as TrackMetadata;
      const position = over.data.current?.position as number | undefined;

      if (track) {
        addToQueue(track, position);
      }
    }

    setActiveTrack(null);
  };

  const handleDragCancel = () => {
    setActiveTrack(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeTrack ? (
          <Card className="w-full opacity-80 shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{activeTrack.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {activeTrack.artist}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
