import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { TrackMetadataSchema } from '@/lib/metadata/schema';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'tracks');

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ tracks: [] });
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    const tracks = files.map(file => {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Validate with Zod schema
      try {
        return TrackMetadataSchema.parse(data);
      } catch (error) {
        console.error(`Invalid metadata in ${file}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove nulls

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error loading tracks:', error);
    return NextResponse.json(
      { error: 'Failed to load tracks' },
      { status: 500 }
    );
  }
}
