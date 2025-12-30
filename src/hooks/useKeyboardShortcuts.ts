'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

export function useKeyboardShortcuts() {
  const playbackState = usePlayerStore((state) => state.playbackState);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const stop = usePlayerStore((state) => state.stop);
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Spacebar: Play/Pause
      if (event.code === 'Space') {
        event.preventDefault();
        if (!currentTrack) return;

        if (playbackState === 'playing') {
          pause();
        } else {
          play();
        }
      }

      // S: Stop
      if (event.code === 'KeyS') {
        event.preventDefault();
        if (currentTrack) {
          stop();
        }
      }

      // Up Arrow: Volume Up
      if (event.code === 'ArrowUp') {
        event.preventDefault();
        const newVolume = Math.min(1, volume + 0.05);
        setVolume(newVolume);
      }

      // Down Arrow: Volume Down
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        const newVolume = Math.max(0, volume - 0.05);
        setVolume(newVolume);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState, play, pause, stop, volume, setVolume, currentTrack]);
}
