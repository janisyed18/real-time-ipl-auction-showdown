import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Crown, Users, DollarSign, Trophy } from 'lucide-react';
import { RoomPlayer, Team } from '@/types/auction';

interface ParticipantsListProps {
  players: RoomPlayer[];
  myTeam: Team | null;
  isHost: boolean;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  players,
  myTeam,
  isHost,
}) => {
  return (
    <CricketCard variant="auction">
      <CricketCardHeader>
        <CricketCardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({players.length})
        </CricketCardTitle>
      </CricketCardHeader>
      <CricketCardContent>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                player.team_id === myTeam?.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {player.team?.logo_url ? (
                    <img 
                      src={player.team.logo_url} 
                      alt={`${player.team.full_name} logo`}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${player.team?.logo_url ? 'hidden' : ''}`}
                    style={{ 
                      backgroundColor: player.team?.primary_color || '#6B7280',
                      color: player.team?.secondary_color || '#FFFFFF'
                    }}
                  >
                    {player.team?.short_name}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.nickname}</span>
                    {player.team_id === myTeam?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                    {/* Add host indicator if needed */}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {player.team?.short_name}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">₹{player.purse_left_cr}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="h-3 w-3" />
                  <span>{player.slots_left} slots</span>
                </div>
              </div>
            </div>
          ))}

          {players.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No participants yet</p>
            </div>
          )}
        </div>
      </CricketCardContent>
    </CricketCard>
  );
};