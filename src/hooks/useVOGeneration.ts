import { useState } from 'react';
import type { VOGenerationRequest, VOGenerationResponse } from '@/types/vo';

export function useVOGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVO = async (
    request: VOGenerationRequest
  ): Promise<VOGenerationResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/vo-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'VO generation failed');
      }

      const result: VOGenerationResponse = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('VO generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateVO, isGenerating, error };
}
