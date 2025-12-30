import { Howl, Howler } from 'howler';
import { PlayerEvent, type PlayerError } from '@/types/player';
import type { TrackMetadata } from '@/types/track';

type EventCallback = (data?: any) => void;

export class PlayerController {
  private currentHowl: Howl | null = null;
  private currentTrack: TrackMetadata | null = null;
  private eventListeners: Map<PlayerEvent, Set<EventCallback>> = new Map();
  private positionUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * Load a track into the player
   */
  async load(track: TrackMetadata): Promise<void> {
    // Stop and unload current track
    this.unload();

    this.currentTrack = track;

    return new Promise((resolve, reject) => {
      // Create Howl instance
      this.currentHowl = new Howl({
        src: [`/media/${track.filePath}`],
        html5: true, // Use HTML5 Audio for streaming
        preload: true,
        onload: () => {
          this.emit(PlayerEvent.TRACK_LOADED, track);
          resolve();
        },
        onloaderror: (_id, error) => {
          const playerError: PlayerError = {
            code: 'LOAD_ERROR',
            message: `Failed to load track: ${error}`,
            track,
          };
          this.emit(PlayerEvent.TRACK_ERROR, playerError);
          reject(playerError);
        },
        onplay: () => {
          this.startPositionUpdates();
          this.emit(PlayerEvent.TRACK_PLAYING, track);
        },
        onpause: () => {
          this.stopPositionUpdates();
          this.emit(PlayerEvent.TRACK_PAUSED, track);
        },
        onstop: () => {
          this.stopPositionUpdates();
          this.emit(PlayerEvent.TRACK_STOPPED, track);
        },
        onend: () => {
          this.stopPositionUpdates();
          this.emit(PlayerEvent.TRACK_ENDED, track);
        },
        onplayerror: (_id, error) => {
          const playerError: PlayerError = {
            code: 'PLAY_ERROR',
            message: `Failed to play track: ${error}`,
            track,
          };
          this.emit(PlayerEvent.TRACK_ERROR, playerError);
        },
      });
    });
  }

  /**
   * Play the loaded track
   */
  play(): void {
    if (!this.currentHowl) {
      console.warn('No track loaded');
      return;
    }

    this.currentHowl.play();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.currentHowl) return;
    this.currentHowl.pause();
  }

  /**
   * Stop playback and reset position
   */
  stop(): void {
    if (!this.currentHowl) return;
    this.currentHowl.stop();
  }

  /**
   * Seek to a position (in seconds)
   */
  seek(position: number): void {
    if (!this.currentHowl) return;
    this.currentHowl.seek(position);
    this.emit(PlayerEvent.POSITION_UPDATE, position);
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(clampedVolume);
    this.emit(PlayerEvent.VOLUME_CHANGE, clampedVolume);
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    return Howler.volume();
  }

  /**
   * Mute/unmute
   */
  mute(muted: boolean): void {
    Howler.mute(muted);
    this.emit(PlayerEvent.VOLUME_CHANGE, muted ? 0 : this.getVolume());
  }

  /**
   * Get current playback position (in seconds)
   */
  getCurrentTime(): number {
    if (!this.currentHowl) return 0;
    const seek = this.currentHowl.seek();
    return typeof seek === 'number' ? seek : 0;
  }

  /**
   * Get track duration (in seconds)
   */
  getDuration(): number {
    if (!this.currentHowl) return 0;
    return this.currentHowl.duration();
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.currentHowl?.playing() ?? false;
  }

  /**
   * Get current track
   */
  getCurrentTrack(): TrackMetadata | null {
    return this.currentTrack;
  }

  /**
   * Unload current track and cleanup
   */
  unload(): void {
    if (this.currentHowl) {
      this.stopPositionUpdates();
      this.currentHowl.unload();
      this.currentHowl = null;
    }
    this.currentTrack = null;
  }

  /**
   * Add event listener
   */
  on(event: PlayerEvent, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: PlayerEvent, callback: EventCallback): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: PlayerEvent, data?: any): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Start emitting position updates
   */
  private startPositionUpdates(): void {
    this.stopPositionUpdates();
    this.positionUpdateInterval = setInterval(() => {
      const position = this.getCurrentTime();
      this.emit(PlayerEvent.POSITION_UPDATE, position);
    }, 100); // Update every 100ms
  }

  /**
   * Stop emitting position updates
   */
  private stopPositionUpdates(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.unload();
    this.eventListeners.clear();
  }
}

// Global player instance
let playerInstance: PlayerController | null = null;

/**
 * Get singleton player instance
 */
export function getPlayerInstance(): PlayerController {
  if (!playerInstance) {
    playerInstance = new PlayerController();
  }
  return playerInstance;
}
