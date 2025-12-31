/**
 * ElevenLabs TTS integration for VO audio generation
 */

interface TTSGenerationParams {
  text: string;
  voiceId: string;
  modelId?: string;
}

/**
 * Generate audio from text using ElevenLabs TTS
 * Returns audio as base64-encoded data URL for immediate use
 */
export async function generateTTS(params: TTSGenerationParams): Promise<{
  audioDataUrl: string;
  audioBuffer: ArrayBuffer;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const { text, voiceId, modelId = 'eleven_turbo_v2_5' } = params;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,        // Natural variation
          similarity_boost: 0.75, // Stay true to voice
          style: 0.5,            // Moderate expressiveness
          use_speaker_boost: true // Better clarity
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  // Get audio as ArrayBuffer
  const audioBuffer = await response.arrayBuffer();

  // Convert to base64 data URL for immediate playback
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

  return {
    audioDataUrl,
    audioBuffer
  };
}

/**
 * Get available voices from ElevenLabs
 */
export async function getVoices(): Promise<Array<{
  voice_id: string;
  name: string;
  category: string;
}>> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': apiKey,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`);
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Voice ID presets for different personas
 * You'll need to replace these with actual voice IDs from your ElevenLabs account
 */
export const VOICE_PRESETS = {
  'morning-mike': 'REPLACE_WITH_VOICE_ID', // Energetic male voice
  'afternoon-alex': 'REPLACE_WITH_VOICE_ID', // Warm, friendly voice
  'evening-emma': 'REPLACE_WITH_VOICE_ID', // Smooth female voice
  'default-dj': 'REPLACE_WITH_VOICE_ID', // Versatile default voice
} as const;

/**
 * Get voice ID for a persona
 */
export function getVoiceIdForPersona(personaName: string): string {
  // Map persona names to voice IDs
  const mapping: Record<string, string> = {
    'Morning Mike': VOICE_PRESETS['morning-mike'],
    'Afternoon Alex': VOICE_PRESETS['afternoon-alex'],
    'Evening Emma': VOICE_PRESETS['evening-emma'],
  };

  return mapping[personaName] || VOICE_PRESETS['default-dj'];
}
