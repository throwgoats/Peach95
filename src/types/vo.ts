import type { BreakType } from './talent';

/**
 * Voice-over segment metadata
 */
export interface VOSegment {
  id: string;
  fileUrl: string;
  duration: number;
  startOffset: number; // When to start VO (seconds into song)
  transcript?: string;
  generatedAt: string;
  persona?: string;
  breakType?: BreakType;
}

/**
 * VO generation request parameters
 */
export interface VOGenerationRequest {
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    timing: {
      intro: number;
      coldOpen: boolean;
    };
    rotation: {
      energy: number;
    };
  };
  nextTrack?: {
    title: string;
    artist: string;
  };
  persona: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'overnight';
  energyLevel: number;
  breakType?: BreakType; // Type of break (short, personal, upsell, etc.)
  context?: {
    temperature?: number;
    contestActive?: boolean;
    upcomingEvent?: string;
    previousSongs?: Array<{ title: string; artist: string }>; // For backsells
  };
}

/**
 * VO generation response
 */
export interface VOGenerationResponse {
  segment: VOSegment;
  calculatedOffset: number;
  recommendedIntro: number;
}
