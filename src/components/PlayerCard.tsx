import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { TrendingUp, Target, Globe, IndianRupee, Star } from 'lucide-react';
import { Player, PlayerStats } from '@/types/auction';

interface PlayerCardProps {
  player: Player;
  stats?: PlayerStats;
  onClick?: () => void;
  isSelected?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  stats,
  onClick,
  isSelected = false,
  variant = 'default',
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Batter': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'All-rounder': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'WK': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'Pacer': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'Spinner': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFormColor = (form: number) => {
    if (form >= 70) return 'text-green-600';
    if (form >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (variant === 'compact') {
    return (
      <CricketCard
        variant="player"
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={onClick}
      >
        <CricketCardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{player.name}</h4>
                {player.is_marquee && (
                  <Star className="h-3 w-3 text-primary" />
                )}
                {player.is_overseas && (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <Badge className={getRoleColor(player.role)}>
                {player.role}
              </Badge>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <IndianRupee className="h-3 w-3" />
                {player.base_price_cr}
              </div>
              <p className="text-xs text-muted-foreground">Base</p>
            </div>
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  return (
    <CricketCard
      variant="player"
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CricketCardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CricketCardTitle className="flex items-center gap-2">
              {player.name}
              {player.is_marquee && (
                <Star className="h-4 w-4 text-primary" />
              )}
            </CricketCardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getRoleColor(player.role)}>
                {player.role}
              </Badge>
              {player.is_overseas && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {player.country}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-bold text-primary">
              <IndianRupee className="h-4 w-4" />
              {player.base_price_cr}
            </div>
            <p className="text-xs text-muted-foreground">Base Price</p>
          </div>
        </div>
      </CricketCardHeader>

      {variant === 'detailed' && stats && (
        <CricketCardContent>
          <div className="space-y-4">
            {/* Batting Stats */}
            {player.role !== 'Pacer' && player.role !== 'Spinner' && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Batting
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{stats.batting_sr.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Strike Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{stats.batting_avg.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{stats.boundary_pct.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Boundaries</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bowling Stats */}
            {(player.role === 'Pacer' || player.role === 'Spinner' || player.role === 'All-rounder') && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Bowling
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{stats.bowling_econ.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Economy</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{stats.bowling_sr.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Strike Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form & Experience */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-center">
                <p className={`font-medium ${getFormColor(stats.recent_form)}`}>
                  {stats.recent_form.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Recent Form</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{stats.matches_played}</p>
                <p className="text-xs text-muted-foreground">T20 Matches</p>
              </div>
            </div>
          </div>
        </CricketCardContent>
      )}
    </CricketCard>
  );
};