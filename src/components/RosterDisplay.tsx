import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Trophy, DollarSign, Users } from 'lucide-react';
import { RosterEntry, Player, Team } from '@/types/auction';

interface RosterDisplayProps {
  roster: RosterEntry[];
  players: Player[];
  teams: Team[];
  myTeam: Team | null;
}

export const RosterDisplay: React.FC<RosterDisplayProps> = ({
  roster,
  players,
  teams,
  myTeam
}) => {
  // Group roster by team
  const rosterByTeam = roster.reduce((acc, entry) => {
    if (!acc[entry.team_id]) {
      acc[entry.team_id] = [];
    }
    acc[entry.team_id].push(entry);
    return acc;
  }, {} as Record<string, RosterEntry[]>);

  const getPlayerDetails = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const getTeamDetails = (teamId: string) => {
    return teams.find(t => t.id === teamId);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'batter':
        return 'bg-green-100 text-green-800';
      case 'all-rounder':
        return 'bg-purple-100 text-purple-800';
      case 'wk':
        return 'bg-blue-100 text-blue-800';
      case 'pacer':
      case 'spinner':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (roster.length === 0) {
    return (
      <CricketCard variant="default" className="mb-6">
        <CricketCardHeader>
          <CricketCardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Squad Status
          </CricketCardTitle>
        </CricketCardHeader>
        <CricketCardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No players purchased yet</p>
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(rosterByTeam).map(([teamId, teamRoster]) => {
        const team = getTeamDetails(teamId);
        const isMyTeam = myTeam?.id === teamId;
        const totalSpent = teamRoster.reduce((sum, entry) => sum + entry.price_cr, 0);
        
        return (
          <CricketCard 
            key={teamId} 
            variant={isMyTeam ? "glow" : "default"} 
            className="mb-4"
          >
            <CricketCardHeader>
              <div className="flex items-center justify-between">
                <CricketCardTitle className="flex items-center gap-3">
                  {team?.logo_url && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={team.logo_url} alt={team.short_name} />
                      <AvatarFallback>{team.short_name}</AvatarFallback>
                    </Avatar>
                  )}
                  {team?.full_name || 'Unknown Team'}
                  {isMyTeam && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Your Team
                    </Badge>
                  )}
                </CricketCardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">₹{totalSpent.toFixed(1)}Cr spent</span>
                  <span>•</span>
                  <span>{teamRoster.length} players</span>
                </div>
              </div>
            </CricketCardHeader>
            <CricketCardContent>
              <div className="grid gap-3">
                {teamRoster
                  .sort((a, b) => b.price_cr - a.price_cr) // Sort by price (highest first)
                  .map((entry) => {
                    const player = getPlayerDetails(entry.player_id);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={player?.image_url || ''} alt={player?.name} />
                            <AvatarFallback>
                              {player?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player?.name || 'Unknown Player'}</p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRoleColor(entry.role)}`}
                              >
                                {entry.role}
                              </Badge>
                              {entry.is_overseas && (
                                <Badge variant="secondary" className="text-xs">
                                  Overseas
                                </Badge>
                              )}
                              {player?.country && (
                                <span className="text-xs text-muted-foreground">
                                  {player.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            ₹{entry.price_cr}Cr
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Base: ₹{player?.base_price_cr || 0}Cr
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CricketCardContent>
          </CricketCard>
        );
      })}
    </div>
  );
};