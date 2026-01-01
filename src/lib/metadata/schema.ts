import { z } from 'zod';

export const TrackMetadataSchema = z.object({
  // Core Identification
  id: z.string(),
  filePath: z.string(),

  // Basic Metadata
  title: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  year: z.number().optional(),
  genre: z.string().optional(),

  // Audio Technical Details
  duration: z.number(),
  bitrate: z.number().optional(),
  sampleRate: z.number().optional(),

  // Radio Automation Metadata
  timing: z.object({
    intro: z.number(),
    outro: z.number(),
    hookStart: z.number().optional(),
    coldOpen: z.boolean(),
  }),

  // Rotation & Scheduling
  rotation: z.object({
    category: z.enum(['A', 'B', 'C', 'D']),
    energy: z.number().min(1).max(5),
    playCount: z.number(),
    lastPlayed: z.string().nullable(),
    addedDate: z.string(),
  }),

  // Content Flags
  explicit: z.boolean(),
  daypartRestrictions: z.array(z.string()).optional(),

  // Future: Artwork
  artwork: z.object({
    url: z.string().optional(),
    embedded: z.boolean(),
  }).optional(),

  // Metadata Tracking
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export const SettingsSchema = z.object({
  player: z.object({
    defaultVolume: z.number().min(0).max(1),
    crossfadeDuration: z.number(),
    enableCrossfade: z.boolean(),
    enableAutoAdvance: z.boolean(),
  }),
  library: z.object({
    defaultView: z.enum(['list', 'grid']),
    sortBy: z.string(),
    sortOrder: z.enum(['asc', 'desc']),
  }),
  version: z.number(),
});

export type TrackMetadataType = z.infer<typeof TrackMetadataSchema>;
export type SettingsType = z.infer<typeof SettingsSchema>;
