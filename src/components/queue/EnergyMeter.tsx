'use client';

import { cn } from '@/lib/utils';

interface EnergyMeterProps {
  energy: 1 | 2 | 3 | 4 | 5;
  compact?: boolean;
}

export function EnergyMeter({ energy, compact = false }: EnergyMeterProps) {
  const dots = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5" title={`Energy: ${energy}/5`}>
      {dots.map((level) => (
        <div
          key={level}
          className={cn(
            "rounded-full transition-colors",
            compact ? "w-1.5 h-1.5" : "w-2 h-2",
            level <= energy
              ? "bg-orange-500"
              : "bg-muted border border-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}
