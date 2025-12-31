/**
 * DJ/Talent persona configuration
 */
export interface TalentPersona {
  id: string;
  name: string;
  displayName: string; // "DJ Mike" vs internal "mike"
  photoUrl?: string;
  voiceId?: string; // For TTS services like ElevenLabs
  style: 'energetic' | 'smooth' | 'professional' | 'quirky' | 'chill';
  dayparts: ('morning' | 'afternoon' | 'evening' | 'overnight')[];
  stats?: {
    showsHosted: number;
    yearsOnAir: number;
    favoriteGenre?: string;
  };
  bio?: string;
}

/**
 * Break type determines the style/length of VO segment
 */
export type BreakType =
  | 'short'        // Quick artist/title mention (~3-5s)
  | 'personal'     // DJ personality, share a story (~8-12s)
  | 'upsell'       // Promote upcoming content/events (~8-10s)
  | 'backsell'     // Talk about what just played (~5-8s)
  | 'time-temp'    // Time, temperature, weather check (~5-7s)
  | 'contest'      // Contest promotion/reminder (~10-15s)
  | 'station-id';  // Station identification (~3-5s)

export interface BreakTypeConfig {
  type: BreakType;
  label: string;
  description: string;
  minDuration: number;
  maxDuration: number;
  weight: number; // Probability weight for random selection
}

/**
 * Default break type configurations
 */
export const BREAK_TYPES: Record<BreakType, BreakTypeConfig> = {
  short: {
    type: 'short',
    label: 'Short',
    description: 'Quick artist/title mention',
    minDuration: 3,
    maxDuration: 5,
    weight: 40
  },
  personal: {
    type: 'personal',
    label: 'Personal',
    description: 'DJ shares a story or personality moment',
    minDuration: 8,
    maxDuration: 12,
    weight: 10
  },
  upsell: {
    type: 'upsell',
    label: 'Upsell',
    description: 'Promote upcoming songs, shows, or events',
    minDuration: 8,
    maxDuration: 10,
    weight: 15
  },
  backsell: {
    type: 'backsell',
    label: 'Backsell',
    description: 'Talk about the song that just played',
    minDuration: 5,
    maxDuration: 8,
    weight: 20
  },
  'time-temp': {
    type: 'time-temp',
    label: 'Time & Temp',
    description: 'Time check with weather info',
    minDuration: 5,
    maxDuration: 7,
    weight: 8
  },
  contest: {
    type: 'contest',
    label: 'Contest',
    description: 'Contest promotion or reminder',
    minDuration: 10,
    maxDuration: 15,
    weight: 5
  },
  'station-id': {
    type: 'station-id',
    label: 'Station ID',
    description: 'Station identification',
    minDuration: 3,
    maxDuration: 5,
    weight: 2
  }
};

/**
 * Sample talent personas
 */
export const SAMPLE_TALENTS: TalentPersona[] = [
  {
    id: 'morning-mike',
    name: 'morning-mike',
    displayName: 'Morning Mike',
    photoUrl: '/talent/morning-mike.jpg',
    style: 'energetic',
    dayparts: ['morning'],
    stats: {
      showsHosted: 1250,
      yearsOnAir: 5,
      favoriteGenre: 'Pop'
    },
    bio: 'Your wake-up call with high energy and great vibes!'
  },
  {
    id: 'smooth-sarah',
    name: 'smooth-sarah',
    displayName: 'Smooth Sarah',
    photoUrl: '/talent/smooth-sarah.jpg',
    style: 'smooth',
    dayparts: ['afternoon', 'evening'],
    stats: {
      showsHosted: 2100,
      yearsOnAir: 8,
      favoriteGenre: 'R&B'
    },
    bio: 'Smooth vibes for your afternoon and evening drive.'
  },
  {
    id: 'overnight-alex',
    name: 'overnight-alex',
    displayName: 'Overnight Alex',
    photoUrl: '/talent/overnight-alex.jpg',
    style: 'chill',
    dayparts: ['overnight'],
    stats: {
      showsHosted: 890,
      yearsOnAir: 3,
      favoriteGenre: 'Indie'
    },
    bio: 'Keeping you company through the night with chill beats.'
  }
];

/**
 * Get default talent for time of day
 */
export function getDefaultTalentForDaypart(
  daypart: 'morning' | 'afternoon' | 'evening' | 'overnight'
): TalentPersona | null {
  return SAMPLE_TALENTS.find(t => t.dayparts.includes(daypart)) || SAMPLE_TALENTS[0];
}

/**
 * Select break type randomly based on weights
 */
export function selectRandomBreakType(excludeTypes: BreakType[] = []): BreakType {
  const availableTypes = Object.entries(BREAK_TYPES)
    .filter(([type]) => !excludeTypes.includes(type as BreakType));

  const totalWeight = availableTypes.reduce((sum, [, config]) => sum + config.weight, 0);
  let random = Math.random() * totalWeight;

  for (const [type, config] of availableTypes) {
    random -= config.weight;
    if (random <= 0) {
      return type as BreakType;
    }
  }

  return 'short'; // Fallback
}
