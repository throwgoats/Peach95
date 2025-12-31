# AI Integration Setup Guide

This guide walks you through setting up Claude (Anthropic) and ElevenLabs for automated VO generation.

## Overview

The system uses two AI services:
1. **Claude 3.5 Haiku** (Anthropic) - Generates radio scripts
2. **ElevenLabs TTS** - Converts scripts to speech

## Step 1: Get Anthropic API Key

1. Visit https://console.anthropic.com
2. Sign up or log in
3. Navigate to "API Keys" in the dashboard
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

**Cost**: ~$0.0008 per VO generation (~$2.40/month for 100 VOs/day)

## Step 2: Get ElevenLabs API Key

1. Visit https://elevenlabs.io
2. Sign up or log in
3. Go to Settings → API Keys
4. Copy your API key

**Pricing Tiers**:
- **Free**: 10,000 characters/month (~100-200 VOs)
- **Starter** ($5/month): 30,000 characters/month (~300-600 VOs)
- **Creator** ($22/month): 100,000 characters/month (~1,000-2,000 VOs)

## Step 3: Choose Voices

1. In ElevenLabs dashboard, go to "Voice Library"
2. Browse or create voices for your personas
3. Copy the Voice ID for each voice you want to use

**Recommended setup**:
- Morning Mike: Energetic male voice
- Afternoon Alex: Warm, friendly voice
- Evening Emma: Smooth female voice

## Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your keys:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ELEVENLABS_API_KEY=your-actual-elevenlabs-key-here
   ```

3. Update voice IDs in `src/lib/ai/elevenlabs.ts`:
   ```typescript
   export const VOICE_PRESETS = {
     'morning-mike': 'YOUR_VOICE_ID_HERE',
     'afternoon-alex': 'YOUR_VOICE_ID_HERE',
     'evening-emma': 'YOUR_VOICE_ID_HERE',
     'default-dj': 'YOUR_VOICE_ID_HERE',
   };
   ```

## Step 5: Test the Integration

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Add a track to the queue
3. Check the browser console for logs:
   - "VO generated successfully" = AI working ✅
   - "using mock VO generation" = Fallback mode (no API keys)

## Troubleshooting

### Error: "ANTHROPIC_API_KEY is not configured"
- Make sure `.env.local` exists and contains your API key
- Restart the dev server after adding keys

### Error: "Claude API error (401)"
- Invalid API key - check you copied it correctly
- Key might be expired - generate a new one

### Error: "ElevenLabs API error (401)"
- Invalid ElevenLabs API key
- Check your account is active

### Error: "Failed loading audio file"
- Voice ID might be incorrect
- Check the voice ID in `elevenlabs.ts` matches your account

### VOs are still using mock files
- API keys might not be set correctly
- Check server logs for "using mock VO generation"

## Cost Optimization Tips

1. **Use Claude 3.5 Haiku** (not Sonnet) - 90% cheaper
2. **Set max_tokens appropriately** - Radio scripts are short (~100-200 tokens)
3. **Monitor usage** - Both services have usage dashboards
4. **Start with free tier** - Test thoroughly before upgrading

## Testing Without API Keys

The system automatically falls back to mock generation if keys aren't set. This lets you:
- Develop the UI without API costs
- Test the flow end-to-end
- Share with team members who don't need API access

## Production Considerations

1. **Caching**: Consider caching generated VOs to avoid regenerating identical scripts
2. **Storage**: For production, save audio files to S3/R2 instead of data URLs
3. **Rate Limiting**: Add rate limiting to prevent API abuse
4. **Monitoring**: Track API costs and success rates
5. **Fallbacks**: The system already has graceful fallbacks built in

## Security

- Never commit `.env.local` to git (already in `.gitignore`)
- Use environment variables in production (Vercel, Netlify, etc.)
- Rotate API keys regularly
- Monitor for unusual API usage

## Next Steps

Once working, you can:
1. Add more voice options for different personas
2. Fine-tune voice settings (stability, style)
3. Implement caching for frequently used scripts
4. Add A/B testing for different script styles
