import { Howl, Howler } from 'howler';
import { PlayerEvent, type PlayerError } from '@/types/player';
import type { TrackMetadata } from '@/types/track';
import type { VOSegment } from '@/types/vo';
import { calculateVOStartOffset, validateVOTiming } from './timing';

type EventCallback = (data?: any) => void;

export class PlayerController {
  // Primary audio track (music)
  private primaryHowl: Howl | null = null;
  private primaryTrack: TrackMetadata | null = null;

  // Secondary audio tracks (VO segments)
  private secondaryHowls: Map<string, Howl> = new Map();
  private secondaryTracks: Map<string, VOSegment> = new Map();

  // Position tracking for each track
  private positionTrackers: Map<string, number> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Scheduled VO timeouts
  private scheduledVOTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private eventListeners: Map<PlayerEvent, Set<EventCallback>> = new Map();

  /**
   * Load a track into the player (legacy method for backward compatibility)
   */
  async load(track: TrackMetadata): Promise<void> {
    return this.loadWithVO(track);
  }

  /**
   * Load a track with optional VO segment
   */
  async loadWithVO(track: TrackMetadata, voSegment?: VOSegment): Promise<void> {
    // Stop and unload current track
    this.stopAll();

    // Load primary track (song) - this is critical, must succeed
    await this.loadPrimary(track);

    // Load VO if provided and valid - this is optional, failures are graceful
    if (voSegment) {
      const validation = validateVOTiming(track, voSegment);
      if (!validation.valid) {
        console.warn(`VO timing invalid, track will play without VO: ${validation.reason}`);
        // Continue without VO - track plays normally
        return;
      }

      try {
        await this.loadSecondary('vo', voSegment);
        console.log(`VO loaded successfully for: ${track.title}`);
      } catch (error) {
        // Graceful degradation - VO failed to load but track can still play
        console.warn(`Failed to load VO segment, track will play without voice-over:`, error);
        // Don't re-throw - the primary track is loaded and can play
      }
    }
  }

  /**
   * Load primary track (song)
   */
  private async loadPrimary(track: TrackMetadata): Promise<void> {
    this.primaryTrack = track;

    return new Promise((resolve, reject) => {
      this.primaryHowl = new Howl({
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
          this.startPositionTracking('primary');
          this.emit(PlayerEvent.TRACK_PLAYING, track);
        },
        onpause: () => {
          this.stopPositionTracking('primary');
          this.emit(PlayerEvent.TRACK_PAUSED, track);
        },
        onstop: () => {
          this.stopPositionTracking('primary');
          this.emit(PlayerEvent.TRACK_STOPPED, track);
        },
        onend: () => {
          this.handlePrimaryEnded();
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
   * Load secondary track (VO segment)
   */
  private async loadSecondary(id: string, voSegment: VOSegment): Promise<void> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [voSegment.fileUrl],
        html5: false, // Use Web Audio for better timing control
        preload: true,
        volume: 0.9, // Slightly lower than primary
        onload: () => {
          this.secondaryHowls.set(id, howl);
          this.secondaryTracks.set(id, voSegment);
          this.emit(PlayerEvent.VO_LOADED, voSegment);
          resolve();
        },
        onloaderror: (_id, error) => {
          console.error('Failed to load VO:', error);
          this.emit(PlayerEvent.VO_ERROR, { error, voSegment });
          reject(error);
        },
        onplay: () => {
          this.startPositionTracking(id);
          this.emit(PlayerEvent.VO_PLAYING, voSegment);
        },
        onend: () => {
          this.stopPositionTracking(id);
          this.secondaryHowls.delete(id);
          this.secondaryTracks.delete(id);
          this.emit(PlayerEvent.VO_ENDED, voSegment);
        },
        onplayerror: (_id, error) => {
          console.error('VO playback error:', error);
          this.emit(PlayerEvent.VO_ERROR, { error, voSegment });
        },
      });
    });
  }

  /**
   * Play the loaded track (legacy method for backward compatibility)
   */
  play(): void {
    this.playWithSync();
  }

  /**
   * Play primary track with synchronized VO segments
   */
  playWithSync(): void {
    if (!this.primaryHowl || !this.primaryTrack) {
      console.warn('No track loaded');
      return;
    }

    // Play primary track immediately
    this.primaryHowl.play();

    // Schedule secondary tracks with offset
    this.secondaryTracks.forEach((voSegment, id) => {
      const howl = this.secondaryHowls.get(id);
      if (!howl || !this.primaryTrack) return;

      const offset = calculateVOStartOffset(this.primaryTrack, voSegment);
      const delayMs = offset * 1000;

      // Schedule VO to start after offset
      const timeout = setTimeout(() => {
        // Verify primary is still playing
        if (this.primaryHowl?.playing()) {
          howl.play();
        }
      }, delayMs);

      this.scheduledVOTimeouts.set(id, timeout);
    });
  }

  /**
   * Pause all tracks
   */
  pause(): void {
    this.pauseAll();
  }

  /**
   * Pause all active tracks
   */
  pauseAll(): void {
    this.primaryHowl?.pause();
    this.secondaryHowls.forEach(howl => howl.pause());

    // Clear scheduled VO timeouts
    this.scheduledVOTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledVOTimeouts.clear();
  }

  /**
   * Stop playback (legacy method for backward compatibility)
   */
  stop(): void {
    this.stopAll();
  }

  /**
   * Stop and cleanup all tracks
   */
  stopAll(): void {
    // Clear scheduled VO timeouts
    this.scheduledVOTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledVOTimeouts.clear();

    // Stop and unload primary
    if (this.primaryHowl) {
      this.primaryHowl.stop();
      this.primaryHowl.unload();
      this.primaryHowl = null;
    }
    this.primaryTrack = null;

    // Stop and unload secondaries
    this.secondaryHowls.forEach(howl => {
      howl.stop();
      howl.unload();
    });
    this.secondaryHowls.clear();
    this.secondaryTracks.clear();

    // Stop all position tracking
    this.stopAllPositionTracking();
  }

  /**
   * Handle primary track ended
   */
  private handlePrimaryEnded(): void {
    this.stopPositionTracking('primary');

    // Wait briefly to see if any VO is still playing
    setTimeout(() => {
      const hasActiveVO = Array.from(this.secondaryHowls.values())
        .some(howl => howl.playing());

      if (!hasActiveVO) {
        this.emit(PlayerEvent.TRACK_ENDED, this.primaryTrack);
      }
    }, 100);
  }

  /**
   * Seek to a position (in seconds)
   * Note: Seeking disrupts VO timing, so we stop secondary tracks
   */
  seek(position: number): void {
    if (!this.primaryHowl) return;

    // Stop all secondary tracks when seeking
    this.secondaryHowls.forEach(howl => {
      howl.stop();
      howl.unload();
    });
    this.secondaryHowls.clear();
    this.secondaryTracks.clear();

    // Clear scheduled timeouts
    this.scheduledVOTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledVOTimeouts.clear();

    this.primaryHowl.seek(position);
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
    if (!this.primaryHowl) return 0;
    const seek = this.primaryHowl.seek();
    return typeof seek === 'number' ? seek : 0;
  }

  /**
   * Get track duration (in seconds)
   */
  getDuration(): number {
    if (!this.primaryHowl) return 0;
    return this.primaryHowl.duration();
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.primaryHowl?.playing() ?? false;
  }

  /**
   * Get current track
   */
  getCurrentTrack(): TrackMetadata | null {
    return this.primaryTrack;
  }

  /**
   * Get all track positions (for multi-track UI updates)
   */
  getPositions(): Map<string, number> {
    return new Map(this.positionTrackers);
  }

  /**
   * Unload current track and cleanup (legacy method)
   */
  unload(): void {
    this.stopAll();
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
   * Start position tracking for a specific track
   */
  private startPositionTracking(trackId: string): void {
    this.stopPositionTracking(trackId);

    const intervalId = setInterval(() => {
      if (trackId === 'primary' && this.primaryHowl) {
        const pos = this.primaryHowl.seek();
        this.positionTrackers.set(trackId, typeof pos === 'number' ? pos : 0);
      } else {
        const howl = this.secondaryHowls.get(trackId);
        if (howl) {
          const pos = howl.seek();
          this.positionTrackers.set(trackId, typeof pos === 'number' ? pos : 0);
        }
      }

      // Emit consolidated position update
      this.emit(PlayerEvent.MULTI_TRACK_POSITION_UPDATE, {
        positions: new Map(this.positionTrackers),
        timestamp: Date.now()
      });

      // Also emit legacy POSITION_UPDATE for backward compatibility
      if (trackId === 'primary') {
        this.emit(PlayerEvent.POSITION_UPDATE, this.positionTrackers.get('primary') || 0);
      }
    }, 100); // Update every 100ms

    this.trackingIntervals.set(trackId, intervalId);
  }

  /**
   * Stop position tracking for a specific track
   */
  private stopPositionTracking(trackId: string): void {
    const intervalId = this.trackingIntervals.get(trackId);
    if (intervalId) {
      clearInterval(intervalId);
      this.trackingIntervals.delete(trackId);
      this.positionTrackers.delete(trackId);
    }
  }

  /**
   * Stop all position tracking
   */
  private stopAllPositionTracking(): void {
    this.trackingIntervals.forEach(interval => clearInterval(interval));
    this.trackingIntervals.clear();
    this.positionTrackers.clear();
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopAll();
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
