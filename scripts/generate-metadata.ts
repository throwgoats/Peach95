import * as fs from 'fs';
import * as path from 'path';
import { createSlug } from '../src/lib/utils';

// Simple MP3 duration calculation (approximate)
function getMp3Duration(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    // Rough estimate: 128kbps MP3, but we'll set a default
    // In a real scenario, we'd parse the MP3 header
    const estimatedDuration = (fileSizeInBytes * 8) / (128000); // seconds
    return Math.round(estimatedDuration);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return 180; // Default 3 minutes
  }
}

function generateMetadata() {
  const mediaDir = path.join(process.cwd(), 'media', 'tracks');
  const dataDir = path.join(process.cwd(), 'data', 'tracks');

  // Ensure data/tracks directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Get all MP3 files
  const files = fs.readdirSync(mediaDir).filter(file => file.endsWith('.mp3'));

  console.log(`Found ${files.length} MP3 files. Generating metadata...`);

  const now = new Date().toISOString();

  files.forEach((filename, index) => {
    const slug = createSlug(filename);
    const filePath = path.join(mediaDir, filename);
    const outputPath = path.join(dataDir, `${slug}.json`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${slug}.json (already exists)`);
      return;
    }

    // Extract title from filename (remove .mp3)
    const title = filename.replace(/\.mp3$/i, '');

    const duration = getMp3Duration(filePath);

    // Rotate through categories
    const categories = ['A', 'B', 'C', 'D'] as const;
    const category = categories[index % categories.length];

    // Vary energy levels
    const energy = ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5;

    const metadata = {
      id: slug,
      filePath: `tracks/${filename}`,

      // Basic metadata
      title,
      artist: 'Unknown Artist',
      album: undefined,
      year: undefined,
      genre: undefined,

      // Audio details
      duration,
      bitrate: 128,
      sampleRate: 44100,

      // Radio automation metadata
      timing: {
        intro: 8.0,
        outro: 12.0,
        coldOpen: false,
      },

      // Rotation & scheduling
      rotation: {
        category,
        energy,
        playCount: 0,
        lastPlayed: null,
        addedDate: now,
      },

      // Content flags
      explicit: false,

      // Metadata tracking
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`  ✅ Generated ${slug}.json`);
  });

  console.log(`\n✨ Done! Generated metadata for ${files.length} tracks.`);
  console.log(`📁 Location: ${dataDir}`);
  console.log(`\n💡 Tip: Review and edit the JSON files to add accurate metadata (artist names, intro/outro times, etc.)`);
}

// Also generate settings.json if it doesn't exist
function generateSettings() {
  const settingsPath = path.join(process.cwd(), 'data', 'settings.json');

  if (fs.existsSync(settingsPath)) {
    console.log(`\n⏭️  Settings file already exists`);
    return;
  }

  const settings = {
    player: {
      defaultVolume: 0.8,
      crossfadeDuration: 5.0,
      enableCrossfade: false,
      enableAutoAdvance: false,
    },
    library: {
      defaultView: 'list' as const,
      sortBy: 'title',
      sortOrder: 'asc' as const,
    },
    version: 1,
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`\n✅ Generated settings.json`);
}

// Run the script
console.log('🎵 Peach95 Metadata Generator\n');
generateMetadata();
generateSettings();
