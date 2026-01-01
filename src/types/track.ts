export interface TrackMetadata {
  // Core Identification
  id: string;
  filePath: string;

  // Basic Metadata
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string;

  // Audio Technical Details
  duration: number;
  bitrate?: number;
  sampleRate?: number;

  // Radio Automation Metadata
  timing: {
    intro: number;
    outro: number;
    hookStart?: number;
    coldOpen: boolean;
  };

  // Rotation & Scheduling
  rotation: {
    category: 'A' | 'B' | 'C' | 'D';
    energy: 1 | 2 | 3 | 4 | 5;
    playCount: number;
    lastPlayed: string | null;
    addedDate: string;
  };

  // Content Flags
  explicit: boolean;
  daypartRestrictions?: string[];

  // Future: Artwork
  artwork?: {
    url?: string;
    embedded: boolean;
  };

  // Metadata Tracking
  createdAt: string;
  updatedAt: string;
  version: number;
}
