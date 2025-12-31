# Voice-Over Error Handling & Fallback Strategy

## Overview

The multi-track playback system is designed with graceful degradation in mind. If VO generation or loading fails at any point, **the track will always play normally without the voice-over**. The user experience is never blocked by VO failures.

## Failure Scenarios & Handling

### 1. Cold Open Tracks
**Scenario**: Track has `timing.coldOpen = true` (vocals start immediately)

**Behavior**:
- VO generation is skipped entirely
- Track plays normally without VO
- Console logs: `"Skipping VO generation for cold open track: {title}"`

### 2. VO API Failures

#### 2.1 Client Errors (400-499)
**Scenario**: Invalid request (e.g., API validation failure)

**Behavior**:
- No retry attempts (client error won't be fixed by retrying)
- Track plays without VO
- Console warns: `"VO API returned {status}: {error}. Track will play without VO."`

#### 2.2 Server Errors (500-599)
**Scenario**: Temporary server issue or API downtime

**Behavior**:
- **Automatic retry**: Up to 3 attempts total (initial + 2 retries)
- 500ms delay before first retry, 1000ms before second
- If all retries fail, track plays without VO
- Console warns: `"Failed to generate VO after 3 attempts, track will play without voice-over"`

#### 2.3 Network Errors
**Scenario**: Network timeout, connection refused, etc.

**Behavior**:
- **Automatic retry**: Up to 3 attempts with exponential backoff
- Same graceful degradation as server errors

### 3. Invalid VO Response
**Scenario**: API returns 200 but response is missing required fields

**Behavior**:
- Validation check fails
- Track plays without VO
- Console warns: `"VO API returned invalid segment. Track will play without VO."`

### 4. VO Timing Validation Failure
**Scenario**: VO segment is longer than intro, or timing calculation fails

**Behavior**:
- `validateVOTiming()` rejects the segment
- Track plays without VO
- Console warns: `"VO timing invalid, track will play without VO: {reason}"`

**Common reasons**:
- VO duration exceeds intro length
- Intro too short (< 2 seconds)
- Invalid timing values

### 5. VO Audio File Load Failure
**Scenario**: VO MP3 file returns 404 or fails to load in Howler

**Behavior**:
- Primary track is already loaded and ready
- VO load failure is caught with try-catch
- Track plays without VO
- Console warns: `"Failed to load VO segment, track will play without voice-over"`

**Note**: This does NOT block or interrupt the primary track playback.

## Code Locations

### Store-Level Error Handling
**File**: `src/stores/playerStore.ts`
**Function**: `generateVOForQueueItem()`

```typescript
// Retry logic with exponential backoff
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    // ... fetch VO from API
    if (!response.ok) {
      // Handle 4xx vs 5xx differently
      if (response.status >= 400 && response.status < 500) {
        return; // Don't retry client errors
      }
      throw new Error(); // Retry server errors
    }
    // ... validate response
    return; // Success
  } catch (error) {
    if (attempt === maxRetries) {
      // Give up gracefully after all retries
      console.warn('Track will play without VO');
      return;
    }
  }
}
```

### Player-Level Error Handling
**File**: `src/lib/audio/player.ts`
**Function**: `loadWithVO()`

```typescript
// Primary track is critical - must succeed
await this.loadPrimary(track);

// VO is optional - failures are graceful
if (voSegment) {
  try {
    await this.loadSecondary('vo', voSegment);
  } catch (error) {
    // Gracefully degrade - track plays without VO
    console.warn('Track will play without voice-over', error);
    // Don't re-throw - primary is loaded
  }
}
```

## User Experience

From the user's perspective:

1. **Best case**: Track plays with perfectly timed VO
2. **VO generation fails**: Track plays immediately without VO, no delay or error message
3. **VO file missing**: Track plays without VO, no playback interruption
4. **Network issues**: Brief retry attempts (< 2 seconds total), then track plays without VO

**Important**: The user never sees error dialogs or blocked playback due to VO issues. The app prioritizes playing music over generating voice-overs.

## Testing Error Scenarios

### Simulate API Failure
```javascript
// In browser console:
// 1. Stop dev server temporarily
// 2. Add track to queue
// 3. Track will play without VO after retry attempts

// Or mock a 500 error in the API route:
return NextResponse.json({ error: 'Mock failure' }, { status: 500 });
```

### Simulate Missing VO Files
```bash
# Temporarily rename VO files
mv public/media/vo/vo-short.mp3 public/media/vo/vo-short.mp3.bak
# Add track to queue - will play without VO
```

### Simulate Cold Open
```javascript
// In sample data, set a track to cold open:
timing: { intro: 0, coldOpen: true, ... }
// Track will skip VO generation entirely
```

## Future Enhancements

Potential improvements (not yet implemented):

1. **User notification**: Show subtle toast when VO fails to generate
2. **Manual retry**: Allow user to manually retry VO generation
3. **VO caching**: Cache successful VO segments to avoid regeneration
4. **Fallback VO library**: Use generic pre-recorded VOs if generation fails
5. **Health check**: Ping VO API periodically to detect downtime early

## Monitoring & Debugging

All VO failures are logged to browser console with:
- Warning level (`console.warn`)
- Descriptive message about what failed
- Original error details
- Track title for context

**Search console for**:
- `"Track will play without VO"` - All graceful degradations
- `"Failed to generate VO"` - API failures
- `"Failed to load VO"` - Audio file loading failures
- `"Skipping VO generation"` - Cold open tracks
