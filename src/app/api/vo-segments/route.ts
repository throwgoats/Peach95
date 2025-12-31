import { NextRequest, NextResponse } from 'next/server';
import type { VOGenerationRequest, VOGenerationResponse, VOSegment } from '@/types/vo';
import { calculateVOStartOffset } from '@/lib/audio/timing';
import { BREAK_TYPES, selectRandomBreakType, type BreakType } from '@/types/talent';
import { generateVOScript, estimateScriptDuration } from '@/lib/ai/claude';
import { generateTTS, getVoiceIdForPersona } from '@/lib/ai/elevenlabs';

/**
 * VO segment generation with AI
 * POST /api/vo-segments
 */
export async function POST(request: NextRequest) {
  try {
    const body: VOGenerationRequest = await request.json();
    const { currentTrack, nextTrack, persona, timeOfDay, breakType, context, energyLevel } = body;

    // Validate intro timing
    if (currentTrack.timing.coldOpen) {
      return NextResponse.json(
        { error: 'Cannot generate VO for cold open tracks' },
        { status: 400 }
      );
    }

    // Select break type if not provided
    const selectedBreakType = breakType || selectRandomBreakType();

    // Check if AI is enabled (fallback to mock if no API keys)
    const useAI = process.env.ANTHROPIC_API_KEY && process.env.ELEVENLABS_API_KEY;

    let voSegment: VOSegment;

    if (useAI) {
      // Generate with AI
      voSegment = await generateAIVOSegment(
        currentTrack,
        nextTrack,
        persona,
        timeOfDay,
        selectedBreakType,
        energyLevel,
        context
      );
    } else {
      // Fallback to mock generation
      console.warn('AI API keys not configured, using mock VO generation');
      voSegment = generateMockVOSegment(
        currentTrack,
        nextTrack,
        persona,
        timeOfDay,
        selectedBreakType,
        context
      );
    }

    // Calculate start offset using timing utility
    const calculatedOffset = calculateVOStartOffset(
      {
        id: currentTrack.id,
        filePath: '',
        title: currentTrack.title,
        artist: currentTrack.artist,
        duration: 0,
        timing: {
          intro: currentTrack.timing.intro,
          outro: 0,
          coldOpen: currentTrack.timing.coldOpen,
          coldOut: false
        },
        rotation: {
          category: 'A' as const,
          energy: currentTrack.rotation.energy as 1 | 2 | 3 | 4 | 5,
          playCount: 0,
          lastPlayed: null,
          addedDate: ''
        },
        explicit: false,
        createdAt: '',
        updatedAt: '',
        version: 1
      },
      voSegment
    );

    const response: VOGenerationResponse = {
      segment: { ...voSegment, startOffset: calculatedOffset },
      calculatedOffset,
      recommendedIntro: currentTrack.timing.intro
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('VO generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate VO segment' },
      { status: 500 }
    );
  }
}

/**
 * Generate VO segment using AI (Claude + ElevenLabs)
 */
async function generateAIVOSegment(
  currentTrack: VOGenerationRequest['currentTrack'],
  nextTrack: VOGenerationRequest['nextTrack'] | undefined,
  persona: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'overnight',
  breakType: BreakType,
  energyLevel: number,
  context?: VOGenerationRequest['context']
): Promise<VOSegment> {
  // Step 1: Generate script with Claude
  const script = await generateVOScript({
    currentTrack: {
      title: currentTrack.title,
      artist: currentTrack.artist
    },
    nextTrack: nextTrack ? {
      title: nextTrack.title,
      artist: nextTrack.artist
    } : undefined,
    persona,
    timeOfDay,
    breakType,
    energyLevel,
    context
  });

  // Step 2: Generate audio with ElevenLabs
  const voiceId = getVoiceIdForPersona(persona);
  const { audioDataUrl } = await generateTTS({
    text: script,
    voiceId
  });

  // Step 3: Estimate duration
  const duration = estimateScriptDuration(script);

  return {
    id: `vo-${Date.now()}`,
    fileUrl: audioDataUrl, // Base64 data URL for immediate use
    duration,
    startOffset: 0, // Will be calculated by caller
    transcript: script,
    generatedAt: new Date().toISOString(),
    persona,
    breakType
  };
}

/**
 * Generate mock VO segment for testing
 */
function generateMockVOSegment(
  currentTrack: VOGenerationRequest['currentTrack'],
  nextTrack: VOGenerationRequest['nextTrack'] | undefined,
  persona: string,
  timeOfDay: string,
  breakType: BreakType,
  context?: VOGenerationRequest['context']
): VOSegment {
  const breakConfig = BREAK_TYPES[breakType];
  let transcript = '';

  // Station branding elements
  const opener = Math.random() > 0.5
    ? "Today's Hits and Yesterday's Favorites, Peach 95"
    : "Today's Hits and Yesterday's Favorites";
  const closer = "Peach 95";

  // Generate transcript based on break type
  let mainContent = '';

  switch (breakType) {
    case 'short':
      mainContent = `That was ${currentTrack.artist} with ${currentTrack.title}.`;
      break;

    case 'personal':
      const personalLines = [
        `You know, ${currentTrack.title} by ${currentTrack.artist} always reminds me of summer road trips. Brings back great memories!`,
        `Love this track from ${currentTrack.artist}. Fun fact: I actually saw them live last year - incredible show!`,
        `${currentTrack.title}... this one never gets old. Been in my playlist since day one.`
      ];
      mainContent = personalLines[Math.floor(Math.random() * personalLines.length)];
      break;

    case 'upsell':
      if (nextTrack) {
        mainContent = `That was ${currentTrack.artist}. Coming up, we've got ${nextTrack.title} by ${nextTrack.artist}, and later this hour, even more hits!`;
      } else if (context?.upcomingEvent) {
        mainContent = `${currentTrack.artist} with ${currentTrack.title}. Don't forget - ${context.upcomingEvent} happening soon!`;
      } else {
        mainContent = `That was ${currentTrack.title}. Stay tuned, we've got an amazing hour of music ahead!`;
      }
      break;

    case 'backsell':
      mainContent = `That was ${currentTrack.title} by ${currentTrack.artist}, great track from their latest album.`;
      break;

    case 'time-temp':
      const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const temp = context?.temperature || 72;
      mainContent = `It's ${time}, ${temp} degrees outside. That was ${currentTrack.artist} with ${currentTrack.title}.`;
      break;

    case 'contest':
      if (context?.contestActive) {
        mainContent = `${currentTrack.title} by ${currentTrack.artist}. Remember, call in now for your chance to win - lines are open!`;
      } else {
        mainContent = `That was ${currentTrack.artist}. Keep listening for your chance to win tickets to upcoming shows!`;
      }
      break;

    case 'station-id':
      // Legal ID - just the call sign and artist
      transcript = `${opener}. ${currentTrack.artist}, ${closer}.`;
      break;

    default:
      mainContent = `That was ${currentTrack.artist} with ${currentTrack.title}.`;
  }

  // Build full transcript with opener and closer (unless it's a station-id which has its own format)
  if (breakType !== 'station-id') {
    transcript = `${opener}. ${mainContent} ${closer}.`;
  }

  // Mock duration based on break type config and intro length
  const introLength = currentTrack.timing.intro;
  const targetDuration = Math.min(
    breakConfig.maxDuration,
    Math.max(breakConfig.minDuration, introLength - 1)
  );
  const mockDuration = Math.min(targetDuration, introLength - 1);

  // Use different mock VO files based on duration
  const voFiles = [
    '/media/vo/vo-short.mp3',   // ~3s
    '/media/vo/vo-medium.mp3',  // ~5s
    '/media/vo/vo-long.mp3'     // ~7s
  ];

  const fileIndex = mockDuration <= 3 ? 0 : mockDuration <= 5 ? 1 : 2;

  return {
    id: `vo-${Date.now()}`,
    fileUrl: voFiles[fileIndex],
    duration: mockDuration,
    startOffset: 0, // Will be calculated by caller
    transcript,
    generatedAt: new Date().toISOString(),
    persona,
    breakType
  };
}
