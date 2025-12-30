import { TrackMetadataSchema, SettingsSchema } from './schema';
import type { TrackMetadata } from '@/types/track';
import type { TrackMetadataType, SettingsType } from './schema';

/**
 * Load all track metadata from the data directory
 */
export async function loadAllTracks(): Promise<TrackMetadata[]> {
  try {
    const response = await fetch('/api/tracks');
    if (!response.ok) {
      throw new Error('Failed to load tracks');
    }
    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error('Error loading tracks:', error);
    return [];
  }
}

/**
 * Load a single track by ID
 */
export async function loadTrack(id: string): Promise<TrackMetadata | null> {
  try {
    const response = await fetch(`/api/tracks/${id}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return TrackMetadataSchema.parse(data) as TrackMetadata;
  } catch (error) {
    console.error(`Error loading track ${id}:`, error);
    return null;
  }
}

/**
 * Load settings
 */
export async function loadSettings(): Promise<SettingsType> {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      throw new Error('Failed to load settings');
    }
    const data = await response.json();
    return SettingsSchema.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return defaults if settings don't exist
    return {
      player: {
        defaultVolume: 0.8,
        crossfadeDuration: 5.0,
        enableCrossfade: false,
        enableAutoAdvance: false,
      },
      library: {
        defaultView: 'list',
        sortBy: 'title',
        sortOrder: 'asc',
      },
      version: 1,
    };
  }
}
