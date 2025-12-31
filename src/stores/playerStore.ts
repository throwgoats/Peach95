import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, PlaybackState } from '@/types/player';
import type { TrackMetadata } from '@/types/track';
import type { QueueItem, QueueItemPlaybackState } from '@/types/queue';
import type { VOSegment, VOGenerationRequest, VOGenerationResponse } from '@/types/vo';
import type { TalentPersona, BreakType } from '@/types/talent';
import { getPlayerInstance } from '@/lib/audio/player';
import { PlayerEvent } from '@/types/player';
import { getDefaultTalentForDaypart, selectRandomBreakType } from '@/types/talent';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'overnight' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'overnight';
}

interface PlayerStore extends PlayerState {
  // Actions
  loadTrack: (track: TrackMetadata) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPosition: (position: number) => void;
  setPlaybackState: (state: PlaybackState) => void;

  // Multi-track state
  queueItems: QueueItem[];
  queueItemStates: Map<number, QueueItemPlaybackState>;

  // Talent/DJ state
  activeTalent: TalentPersona | null;
  setActiveTalent: (talent: TalentPersona) => void;

  // Queue actions (updated for QueueItem)
  addToQueue: (track: TrackMetadata, position?: number) => Promise<void>;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playFromQueue: (index: number) => void;
  playNext: () => void;

  // VO generation
  generateVOForQueueItem: (position: number) => Promise<void>;
  attachVOToQueueItem: (position: number, segment: VOSegment) => void;

  // Multi-track playback
  loadAndPlayQueueItem: (position: number) => Promise<void>;
  updateQueueItemPlaybackState: (position: number, state: Partial<QueueItemPlaybackState>) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => {
      const player = getPlayerInstance();

      // Set up event listeners
      player.on(PlayerEvent.TRACK_LOADED, (track: TrackMetadata) => {
        set({
          currentTrack: track,
          playbackState: 'stopped',
          position: 0,
        });
      });

      player.on(PlayerEvent.TRACK_PLAYING, () => {
        set({ playbackState: 'playing' });
      });

      player.on(PlayerEvent.TRACK_PAUSED, () => {
        set({ playbackState: 'paused' });
      });

      player.on(PlayerEvent.TRACK_STOPPED, () => {
        set({ playbackState: 'stopped', position: 0 });
      });

      player.on(PlayerEvent.TRACK_ENDED, () => {
        set({ playbackState: 'stopped', position: 0 });

        // Auto-advance to next track in queue
        const { queue } = get();
        if (queue.length > 0) {
          setTimeout(() => {
            get().playNext();
          }, 100);
        }
      });

      player.on(PlayerEvent.POSITION_UPDATE, (position: number) => {
        set({ position });
      });

      player.on(PlayerEvent.MULTI_TRACK_POSITION_UPDATE, (data: { positions: Map<string, number> }) => {
        const { positions } = data;
        const { currentTrack, queueItems } = get();

        // Find current queue item
        const currentIndex = queueItems.findIndex(
          item => item.track.id === currentTrack?.id
        );

        if (currentIndex !== -1) {
          get().updateQueueItemPlaybackState(currentIndex, {
            primaryPosition: positions.get('primary') || 0,
            secondaryPosition: positions.get('vo')
          });
        }

        // Update main position for backward compatibility
        set({ position: positions.get('primary') || 0 });
      });

      player.on(PlayerEvent.VOLUME_CHANGE, (volume: number) => {
        set({ volume, muted: volume === 0 });
      });

      player.on(PlayerEvent.TRACK_ERROR, (error) => {
        console.error('Player error:', error);
        set({ playbackState: 'stopped' });
      });

      return {
        // Initial state
        currentTrack: null,
        playbackState: 'stopped',
        position: 0,
        volume: 0.8,
        muted: false,
        queue: [], // Keep for backward compatibility
        queueItems: [],
        queueItemStates: new Map(),
        activeTalent: getDefaultTalentForDaypart(getTimeOfDay()),

        // Actions
        loadTrack: async (track: TrackMetadata) => {
          set({ playbackState: 'loading' });
          try {
            await player.load(track);
          } catch (error) {
            console.error('Failed to load track:', error);
            set({ playbackState: 'stopped' });
          }
        },

        play: () => {
          player.play();
        },

        pause: () => {
          player.pause();
        },

        stop: () => {
          player.stop();
        },

        seek: (position: number) => {
          player.seek(position);
        },

        setVolume: (volume: number) => {
          player.setVolume(volume);
          set({ volume, muted: false });
        },

        toggleMute: () => {
          const { muted } = get();
          player.mute(!muted);
          set({ muted: !muted });
        },

        setPosition: (position: number) => {
          set({ position });
        },

        setPlaybackState: (playbackState: PlaybackState) => {
          set({ playbackState });
        },

        // Queue actions
        addToQueue: async (track: TrackMetadata, position?: number) => {
          const { queueItems } = get();
          const newQueueItems = [...queueItems];

          const insertPos = position !== undefined && position >= 0 && position <= queueItems.length
            ? position
            : queueItems.length;

          const queueItem: QueueItem = {
            track,
            queuePosition: insertPos,
            addedAt: new Date().toISOString()
          };

          newQueueItems.splice(insertPos, 0, queueItem);

          // Update positions for all items
          newQueueItems.forEach((item, idx) => {
            item.queuePosition = idx;
          });

          set({
            queueItems: newQueueItems,
            queue: newQueueItems.map(item => item.track) // Keep queue in sync for backward compatibility
          });

          // Generate VO if track is in top 3 positions (keeps 2 ready + 1 warming)
          if (insertPos < 3) {
            await get().generateVOForQueueItem(insertPos);
          }
        },

        removeFromQueue: (index: number) => {
          const { queueItems, queueItemStates } = get();
          const newQueueItems = queueItems.filter((_, i) => i !== index);

          // Update positions
          newQueueItems.forEach((item, idx) => {
            item.queuePosition = idx;
          });

          // Remove playback state
          const newStates = new Map(queueItemStates);
          newStates.delete(index);

          set({
            queueItems: newQueueItems,
            queue: newQueueItems.map(item => item.track),
            queueItemStates: newStates
          });
        },

        reorderQueue: async (fromIndex: number, toIndex: number) => {
          const { queueItems } = get();
          const newQueueItems = [...queueItems];
          const [movedItem] = newQueueItems.splice(fromIndex, 1);
          newQueueItems.splice(toIndex, 0, movedItem);

          // Update positions
          newQueueItems.forEach((item, idx) => {
            item.queuePosition = idx;
          });

          set({
            queueItems: newQueueItems,
            queue: newQueueItems.map(item => item.track)
          });

          // Regenerate VO for top 3 if they changed
          if (toIndex < 3 || fromIndex < 3) {
            for (let i = 0; i < Math.min(3, newQueueItems.length); i++) {
              if (!newQueueItems[i].voSegment) {
                await get().generateVOForQueueItem(i);
              }
            }
          }
        },

        clearQueue: () => {
          set({
            queueItems: [],
            queue: [],
            queueItemStates: new Map()
          });
        },

        playFromQueue: async (index: number) => {
          await get().loadAndPlayQueueItem(index);

          // Remove from queue after starting playback
          const { queueItems } = get();
          const newQueueItems = queueItems.filter((_, i) => i !== index);
          newQueueItems.forEach((item, idx) => {
            item.queuePosition = idx;
          });
          set({
            queueItems: newQueueItems,
            queue: newQueueItems.map(item => item.track)
          });
        },

        playNext: async () => {
          const { queueItems } = get();

          if (queueItems.length > 0) {
            // Play first item
            await get().loadAndPlayQueueItem(0);

            // Remove first track from queue
            const newQueueItems = queueItems.slice(1);
            newQueueItems.forEach((item, idx) => {
              item.queuePosition = idx;
            });
            set({
              queueItems: newQueueItems,
              queue: newQueueItems.map(item => item.track)
            });

            // Generate VO for position 2 (the new third item) if it doesn't have one yet
            // This maintains the "top 3 ready" window as items advance
            if (newQueueItems.length > 2 && !newQueueItems[2].voSegment) {
              await get().generateVOForQueueItem(2);
            }
          }
        },

        // VO generation
        generateVOForQueueItem: async (position: number) => {
          const { queueItems, activeTalent } = get();
          if (position >= queueItems.length) return;

          const queueItem = queueItems[position];
          const nextItem = queueItems[position + 1];

          // TODO: Check clock/scheduling to determine if this should be VO or stinger
          // For now, always attempt VO generation. Future: clock will set transitionType
          // and this function will branch based on that:
          // - 'vo': Generate VO segment (current behavior)
          // - 'stinger': Select and attach stinger segment instead
          // - 'none': No transition, just song
          //
          // IMPORTANT: Cold open tracks ALWAYS get stingers (never VO)
          // VO over vocals sounds unprofessional - stinger bridges previous song to cold open

          // Don't generate VO for cold open (will get stinger instead when clock is implemented)
          if (queueItem.track.timing.coldOpen) {
            console.log(`Skipping VO generation for cold open track: ${queueItem.track.title} (will use stinger)`);
            return;
          }

          // Use active talent or default
          const talent = activeTalent || getDefaultTalentForDaypart(getTimeOfDay());
          const breakType = selectRandomBreakType();

          // Retry logic for transient failures (network issues, etc.)
          const maxRetries = 2;
          let lastError: Error | null = null;

          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 0) {
                console.log(`Retrying VO generation (attempt ${attempt + 1}/${maxRetries + 1})...`);
                // Small delay before retry
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              }

              // Get previous track for backsell references
              const prevItem = position > 0 ? get().queueItems[position - 1] : null;

              const response = await fetch('/api/vo-segments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  currentTrack: {
                    id: queueItem.track.id,
                    title: queueItem.track.title,
                    artist: queueItem.track.artist,
                    timing: {
                      intro: queueItem.track.timing.intro,
                      coldOpen: queueItem.track.timing.coldOpen
                    },
                    rotation: {
                      energy: queueItem.track.rotation.energy
                    }
                  },
                  previousTrack: prevItem ? {
                    title: prevItem.track.title,
                    artist: prevItem.track.artist
                  } : undefined,
                  nextTrack: nextItem ? {
                    title: nextItem.track.title,
                    artist: nextItem.track.artist
                  } : undefined,
                  persona: talent?.name || 'default-dj',
                  timeOfDay: getTimeOfDay(),
                  energyLevel: queueItem.track.rotation.energy,
                  breakType,
                  context: {
                    temperature: 72, // TODO: Get from weather API
                    contestActive: false, // TODO: Get from app state
                  }
                })
              });

              if (!response.ok) {
                const errorText = await response.text();

                // Don't retry on 400 errors (client errors like cold open tracks)
                if (response.status >= 400 && response.status < 500) {
                  console.warn(`VO API returned ${response.status}: ${errorText}. Track will play without VO.`);
                  return; // Graceful fallback - just don't attach a VO segment
                }

                // Retry on 5xx server errors
                throw new Error(`API error ${response.status}: ${errorText}`);
              }

              const result: VOGenerationResponse = await response.json();

              // Validate the segment before attaching
              if (!result.segment || !result.segment.fileUrl) {
                console.warn('VO API returned invalid segment. Track will play without VO.');
                return;
              }

              get().attachVOToQueueItem(position, result.segment);
              console.log(`VO generated successfully for: ${queueItem.track.title} (${result.segment.breakType})`);
              return; // Success - exit retry loop
            } catch (error) {
              lastError = error as Error;

              // If this was the last attempt, give up gracefully
              if (attempt === maxRetries) {
                console.warn(`Failed to generate VO after ${maxRetries + 1} attempts, track will play without voice-over:`, lastError);
                // Graceful degradation - don't attach VO segment, track will play normally
                return;
              }

              // Otherwise, continue to next retry attempt
            }
          }
        },

        setActiveTalent: (talent: TalentPersona) => {
          set({ activeTalent: talent });
        },

        attachVOToQueueItem: (position: number, segment: VOSegment) => {
          const { queueItems } = get();
          const newItems = [...queueItems];

          if (position < newItems.length) {
            newItems[position] = {
              ...newItems[position],
              voSegment: segment
            };
            set({
              queueItems: newItems,
              queue: newItems.map(item => item.track)
            });
          }
        },

        // Multi-track playback
        loadAndPlayQueueItem: async (position: number) => {
          const { queueItems } = get();
          if (position >= queueItems.length) return;

          const queueItem = queueItems[position];

          // Load with VO if available
          await player.loadWithVO(queueItem.track, queueItem.voSegment);
          player.playWithSync();

          // Initialize playback state tracking
          get().updateQueueItemPlaybackState(position, {
            queuePosition: position,
            primaryPosition: 0,
            secondaryPosition: 0,
            isPlaying: true,
            isPaused: false
          });
        },

        updateQueueItemPlaybackState: (position: number, state: Partial<QueueItemPlaybackState>) => {
          const { queueItemStates } = get();
          const newStates = new Map(queueItemStates);

          const existingState = newStates.get(position);
          newStates.set(position, {
            ...existingState,
            queuePosition: position,
            primaryPosition: existingState?.primaryPosition || 0,
            secondaryPosition: existingState?.secondaryPosition,
            isPlaying: existingState?.isPlaying || false,
            isPaused: existingState?.isPaused || false,
            ...state
          });

          set({ queueItemStates: newStates });
        },
      };
    },
    {
      name: 'peach95-player',
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        // Explicitly exclude queue from persistence
      }),
    }
  )
);
