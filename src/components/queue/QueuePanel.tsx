'use client';

import { usePlayerStore } from '@/stores/playerStore';
import { QueueItem } from './QueueItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListMusic, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function QueuePanel() {
  const queue = usePlayerStore((state) => state.queue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const reorderQueue = usePlayerStore((state) => state.reorderQueue);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  // Calculate total duration
  const totalDuration = queue.reduce((sum, track) => sum + track.duration, 0);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Make queue panel a drop zone
  const { setNodeRef, isOver } = useDroppable({
    id: 'queue-drop-zone',
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handle drag from library to queue
    if (active.id.toString().startsWith('library-') && over?.id === 'queue-drop-zone') {
      const track = active.data.current?.track;
      if (track) {
        addToQueue(track);
      }
      return;
    }

    // Handle reordering within queue
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(
        (_, i) => active.id === queue[i].id + '-' + i
      );
      const newIndex = queue.findIndex(
        (_, i) => over.id === queue[i].id + '-' + i
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  // Empty state
  if (queue.length === 0) {
    return (
      <Card ref={setNodeRef} className={`${isOver ? 'ring-2 ring-primary bg-accent/50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListMusic className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Queue is empty</p>
            <p className="text-sm text-muted-foreground mt-2">
              Drag tracks from the library to queue them
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={setNodeRef} className={`flex flex-col ${isOver ? 'ring-2 ring-primary bg-accent/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5" />
            Queue ({queue.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQueue}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {formatDuration(totalDuration)}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={queue.map((t, i) => t.id + '-' + i)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {queue.map((track, index) => (
                <QueueItem
                  key={track.id + '-' + index}
                  track={track}
                  index={index}
                  position={index + 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
