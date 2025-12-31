/**
 * Claude AI integration for VO script generation
 */

import { BREAK_TYPES, type BreakType } from '@/types/talent';

interface ScriptGenerationParams {
  currentTrack: {
    title: string;
    artist: string;
  };
  previousTrack?: {
    title: string;
    artist: string;
  };
  nextTrack?: {
    title: string;
    artist: string;
  };
  persona: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'overnight';
  breakType: BreakType;
  energyLevel: number;
  context?: {
    temperature?: number;
    contestActive?: boolean;
    upcomingEvent?: string;
  };
}

/**
 * Generate a radio VO script using Claude 3.5 Haiku
 */
export async function generateVOScript(params: ScriptGenerationParams): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const prompt = buildPrompt(params);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022', // Fast & cost-effective
      max_tokens: 300, // Scripts are short
      temperature: 0.8, // Balance creativity with consistency
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const script = data.content[0].text.trim();

  // Validate script isn't empty
  if (!script || script.length < 10) {
    throw new Error('Generated script is too short or empty');
  }

  return script;
}

/**
 * Build the prompt for Claude based on break type and context
 */
function buildPrompt(params: ScriptGenerationParams): string {
  const breakConfig = BREAK_TYPES[params.breakType];
  const { currentTrack, previousTrack, nextTrack, persona, timeOfDay, energyLevel, context } = params;

  // Energy-based tone guidance
  const energyTone = energyLevel >= 4
    ? 'upbeat and energetic'
    : energyLevel >= 3
    ? 'warm and engaging'
    : 'smooth and laid-back';

  // Time-specific guidance
  const timeGuidance = {
    morning: 'bright, welcoming morning energy',
    afternoon: 'steady, friendly afternoon vibe',
    evening: 'relaxed, evening wind-down feel',
    overnight: 'intimate, late-night atmosphere'
  }[timeOfDay];

  let specificInstructions = '';

  switch (params.breakType) {
    case 'short':
      specificInstructions = `Generate a brief backsell of the song that just played.`;
      break;

    case 'personal':
      specificInstructions = `Share a personal anecdote or fun fact about the song or artist. Make it feel genuine and relatable.`;
      break;

    case 'upsell':
      specificInstructions = nextTrack
        ? `Tease the upcoming song "${nextTrack.title}" by ${nextTrack.artist} and build excitement for what's coming.`
        : context?.upcomingEvent
        ? `Mention the upcoming event: "${context.upcomingEvent}" and create excitement.`
        : `Create anticipation for the great music coming up this hour.`;
      break;

    case 'backsell':
      specificInstructions = `Give credit to the track that just played with context about the album or artist's recent work.`;
      break;

    case 'time-temp':
      const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const temp = context?.temperature || 72;
      specificInstructions = `Mention it's ${time} and ${temp} degrees, then backsell the song that just played.`;
      break;

    case 'contest':
      specificInstructions = context?.contestActive
        ? `Remind listeners about the active contest and encourage them to call in. Create urgency.`
        : `Tease upcoming contests and prizes to keep listeners engaged.`;
      break;

    case 'station-id':
      specificInstructions = `This is a legal station ID. Keep it VERY brief - just the station call sign and artist name. No extra commentary.`;
      break;

    default:
      specificInstructions = `Generate a standard backsell of the song.`;
  }

  return `You are ${persona}, a radio DJ for Peach 95: "Today's Hits and Yesterday's Favorites".

Generate a ${params.breakType} radio voice-over for the ${timeOfDay} shift.

TRACK INFORMATION:
${previousTrack ? `- Just played: "${previousTrack.title}" by ${previousTrack.artist}` : ''}
- Now playing: "${currentTrack.title}" by ${currentTrack.artist}
${nextTrack ? `- Coming up next: "${nextTrack.title}" by ${nextTrack.artist}` : ''}

STYLE REQUIREMENTS:
- Tone: ${energyTone}, ${timeGuidance}
- Duration: ${breakConfig.minDuration}-${breakConfig.maxDuration} seconds of speech
- Delivery: ${breakConfig.label} format

MANDATORY FORMAT:
1. ALWAYS open with: "Today's Hits and Yesterday's Favorites" (randomly add "Peach 95" after it ~50% of the time)
2. Your main content
3. ALWAYS close with: "Peach 95"

${params.breakType === 'station-id' ? '**EXCEPTION FOR STATION-ID**: Use format "Today\'s Hits and Yesterday\'s Favorites, Peach 95. [Artist name], Peach 95."' : ''}

TASK:
${specificInstructions}

CONSTRAINTS:
- Natural, conversational language (avoid radio clichés)
- No stage directions, timestamps, or formatting
- Keep it tight - radio moves fast
- Sound genuine, not scripted
- Match the energy level of the music

Generate ONLY the script text, nothing else:`;
}

/**
 * Estimate duration in seconds based on word count
 * Average speaking rate: ~150 words per minute = 2.5 words per second
 */
export function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length;
  const secondsPerWord = 0.4; // Slightly slower than conversational for radio clarity
  return Math.ceil(wordCount * secondsPerWord);
}
