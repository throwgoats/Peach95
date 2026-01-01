'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, ChevronDown, ChevronUp, User } from 'lucide-react';
import { SAMPLE_TALENTS, getDefaultTalentForDaypart, type TalentPersona } from '@/types/talent';
import { usePlayerStore } from '@/stores/playerStore';

export function DJSelector() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDaypart, setCurrentDaypart] = useState<'morning' | 'afternoon' | 'evening' | 'overnight'>('morning');
  const activeTalent = usePlayerStore(state => state.activeTalent);
  const setActiveTalent = usePlayerStore(state => state.setActiveTalent);

  // Calculate daypart only on client side to avoid hydration mismatch
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setCurrentDaypart('morning');
    else if (hour >= 12 && hour < 18) setCurrentDaypart('afternoon');
    else if (hour >= 18 && hour < 22) setCurrentDaypart('evening');
    else setCurrentDaypart('overnight');
  }, []);

  // Use active talent or default for current daypart
  const currentTalent = activeTalent || getDefaultTalentForDaypart(currentDaypart);

  if (!currentTalent) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            On Air
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current DJ Display */}
        <div className="flex items-center gap-3">
          {/* Photo */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {currentTalent.photoUrl ? (
              <img
                src={currentTalent.photoUrl}
                alt={currentTalent.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{currentTalent.displayName}</h3>
            <Badge variant="secondary" className="text-xs">
              {currentTalent.style}
            </Badge>
          </div>
        </div>

        {/* Stats - Always visible */}
        {currentTalent.stats && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-muted/50 rounded p-2">
              <div className="font-semibold">{currentTalent.stats.showsHosted}</div>
              <div className="text-xs text-muted-foreground">Shows</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="font-semibold">{currentTalent.stats.yearsOnAir}</div>
              <div className="text-xs text-muted-foreground">Years</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="font-semibold text-xs truncate">
                {currentTalent.stats.favoriteGenre || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Genre</div>
            </div>
          </div>
        )}

        {/* Expanded view - Bio and DJ selector */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {currentTalent.bio && (
              <p className="text-sm text-muted-foreground">{currentTalent.bio}</p>
            )}

            {/* DJ Selector */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Switch DJ:</h4>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_TALENTS.map((talent) => (
                  <Button
                    key={talent.id}
                    variant={currentTalent.id === talent.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTalent(talent)}
                    className="justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="truncate">{talent.displayName}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {talent.style}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coming Up Next (placeholder) */}
        {!isExpanded && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">Coming up next</div>
            <div className="text-sm font-medium">Next DJ will be determined by daypart</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
