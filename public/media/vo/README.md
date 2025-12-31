# Mock VO Audio Files

This directory should contain mock voice-over audio files for testing the multi-track playback system.

## Required Files

You need to create 3 mock VO files with the following specifications:

1. **vo-short.mp3** - ~3 seconds
   - Example text: "That was [Artist] with [Title]."

2. **vo-medium.mp3** - ~5 seconds
   - Example text: "You're listening to Peach95. That was [Artist] with [Title]."

3. **vo-long.mp3** - ~7 seconds
   - Example text: "That was [Artist] with [Title], here on Peach95. Coming up next, more great music."

## How to Generate Mock VO Files

### Option 1: Use Text-to-Speech Services

**ElevenLabs** (Recommended):
1. Go to https://elevenlabs.io
2. Sign up for free account
3. Use the "Speech Synthesis" feature
4. Select a voice (e.g., "Adam" for male, "Bella" for female)
5. Paste the example texts above
6. Generate and download as MP3
7. Rename files to match the required names

**Google Cloud TTS**:
```bash
# Install gcloud CLI and enable Text-to-Speech API
# Then run:
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "input":{"text":"That was Artist with Title."},
    "voice":{"languageCode":"en-US","name":"en-US-Neural2-J"},
    "audioConfig":{"audioEncoding":"MP3"}
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" | \
  jq -r '.audioContent' | base64 -d > vo-short.mp3
```

### Option 2: Record Your Own

Use any audio recording software:
1. Open Audacity, GarageBand, or QuickTime Player
2. Record yourself reading the example texts
3. Export as MP3 with appropriate duration
4. Save with the required filenames

### Option 3: Use Existing Audio

For quick testing, you can temporarily use any MP3 files:
1. Find or create 3 MP3 files of different durations (~3s, ~5s, ~7s)
2. Rename them to `vo-short.mp3`, `vo-medium.mp3`, `vo-long.mp3`
3. Place them in this directory

## Verification

Once files are in place, the API will automatically use them when generating VO segments for queue items in positions 1-2.

The system will select the appropriate file based on the calculated VO duration:
- ≤3s: uses vo-short.mp3
- ≤5s: uses vo-medium.mp3
- >5s: uses vo-long.mp3
