import { TrackMetadata } from './track';

export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'loading';

export interface PlayerState {
  currentTrack: TrackMetadata | null;
  playbackState: PlaybackState;
  position: number;
  volume: number;
  muted: boolean;
  queue: TrackMetadata[];
}

export enum PlayerEvent {
  TRACK_LOADED = 'track:loaded',
  TRACK_PLAYING = 'track:playing',
  TRACK_PAUSED = 'track:paused',
  TRACK_STOPPED = 'track:stopped',
  TRACK_ENDED = 'track:ended',
  TRACK_ERROR = 'track:error',
  POSITION_UPDATE = 'position:update',
  VOLUME_CHANGE = 'volume:change',
  // Multi-track events
  VO_LOADED = 'vo:loaded',
  VO_PLAYING = 'vo:playing',
  VO_ENDED = 'vo:ended',
  VO_ERROR = 'vo:error',
  MULTI_TRACK_POSITION_UPDATE = 'multitrack:position'
}

export interface PlayerError {
  code: string;
  message: string;
  track?: TrackMetadata;
}
