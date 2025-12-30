import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, PlaybackState } from '@/types/player';
import type { TrackMetadata } from '@/types/track';
import { getPlayerInstance } from '@/lib/audio/player';
import { PlayerEvent } from '@/types/player';

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

  // Queue actions
  addToQueue: (track: TrackMetadata, position?: number) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playFromQueue: (index: number) => void;
  playNext: () => void;
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
        queue: [],

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
        addToQueue: (track: TrackMetadata, position?: number) => {
          const { queue } = get();
          const newQueue = [...queue];

          if (position !== undefined && position >= 0 && position <= queue.length) {
            newQueue.splice(position, 0, track);
          } else {
            newQueue.push(track);
          }

          set({ queue: newQueue });
        },

        removeFromQueue: (index: number) => {
          const { queue } = get();
          const newQueue = queue.filter((_, i) => i !== index);
          set({ queue: newQueue });
        },

        reorderQueue: (fromIndex: number, toIndex: number) => {
          const { queue } = get();
          const newQueue = [...queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);
          set({ queue: newQueue });
        },

        clearQueue: () => {
          set({ queue: [] });
        },

        playFromQueue: async (index: number) => {
          const { queue, loadTrack, play } = get();
          if (index >= 0 && index < queue.length) {
            const track = queue[index];
            // Remove from queue
            const newQueue = queue.filter((_, i) => i !== index);
            set({ queue: newQueue });
            // Load and play
            await loadTrack(track);
            play();
          }
        },

        playNext: async () => {
          const { queue, loadTrack, play } = get();

          if (queue.length > 0) {
            const nextTrack = queue[0];
            // Remove first track from queue
            set({ queue: queue.slice(1) });
            // Load and play
            await loadTrack(nextTrack);
            play();
          }
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
