import React from 'react';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { ArrowLeft } from 'lucide-react';
import { Team } from '@/types/auction';

interface TeamSelectionProps {
  teams: Team[];
  takenTeams: string[];
  onSelect: (teamId: string) => void;
  loading: boolean;
  nickname: string;
  onBack: () => void;
}

export const TeamSelection: React.FC<TeamSelectionProps> = ({
  teams,
  takenTeams,
  onSelect,
  loading,
  nickname,
  onBack,
}) => {
  const availableTeams = teams.filter(team => !takenTeams.includes(team.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Team</h1>
          <p className="text-muted-foreground">
            Welcome, <span className="font-semibold text-foreground">{nickname}</span>! 
            Select your IPL franchise to join the auction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {teams.map((team) => {
            const isAvailable = !takenTeams.includes(team.id);
            
            return (
              <CricketCard
                key={team.id}
                variant={isAvailable ? "team" : "default"}
                className={`cursor-pointer transition-all duration-300 ${
                  isAvailable 
                    ? 'hover:scale-105 hover:shadow-lg' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => isAvailable && !loading && onSelect(team.id)}
              >
                <CricketCardHeader className="text-center">
                  <div className="h-16 w-16 mx-auto mb-3 relative">
                    {team.logo_url ? (
                      <img 
                        src={team.logo_url} 
                        alt={`${team.full_name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full rounded-full flex items-center justify-center text-2xl font-bold ${team.logo_url ? 'hidden' : ''}`}
                      style={{ 
                        backgroundColor: team.primary_color || '#6B7280',
                        color: team.secondary_color || '#FFFFFF'
                      }}
                    >
                      {team.short_name}
                    </div>
                  </div>
                  <CricketCardTitle className="text-sm">{team.short_name}</CricketCardTitle>
                </CricketCardHeader>
                <CricketCardContent>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {team.full_name}
                  </p>
                  {!isAvailable && (
                    <p className="text-xs text-center text-destructive font-medium">
                      Already Taken
                    </p>
                  )}
                </CricketCardContent>
              </CricketCard>
            );
          })}
        </div>

        {availableTeams.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              All teams have been selected. Please wait for the auction to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};