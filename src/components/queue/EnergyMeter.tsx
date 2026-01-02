'use client';

import { cn } from '@/lib/utils';

interface EnergyMeterProps {
  energy: 1 | 2 | 3 | 4 | 5;
  compact?: boolean;
}

export function EnergyMeter({ energy, compact = false }: EnergyMeterProps) {
  const dots = [1, 2, 3, 4, 5];

  // Gradient colors from orange to pink like the page title
  const getGradientColor = (level: number) => {
    const colors = [
      'bg-orange-500',
      'bg-orange-400',
      'bg-orange-300',
      'bg-pink-400',
      'bg-pink-500',
    ];
    return colors[level - 1];
  };

  return (
    <div className="flex items-center gap-0.5" title={`Energy: ${energy}/5`}>
      {dots.map((level) => (
        <div
          key={level}
          className={cn(
            "rounded-full transition-colors",
            compact ? "w-1.5 h-1.5" : "w-2 h-2",
            level <= energy
              ? getGradientColor(level)
              : "bg-muted border border-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}
