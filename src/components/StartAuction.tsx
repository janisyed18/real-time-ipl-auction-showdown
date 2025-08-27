import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Play, Users, Clock, DollarSign, Gavel, Search } from 'lucide-react';
import { useAuctionStore } from '@/store/auctionStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@/types/auction';

interface StartAuctionProps {
  roomId: string;
  isHost: boolean;
  roomStatus: string;
}

export const StartAuction: React.FC<StartAuctionProps> = ({ roomId, isHost, roomStatus }) => {
  const { availablePlayers, players, myTeam } = useAuctionStore();
  const { toast } = useToast();
  const [starting, setStarting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nominating, setNominating] = useState(false);

  const handleStartAuction = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('start_auction', {
        body: { roomId }
      });

      if (error) throw error;

      toast({
        title: "Auction Started!",
        description: "The auction is now live. Players can start nominating.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start auction",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  const handleNominatePlayer = async (player: Player) => {
    if (!myTeam) {
      toast({
        title: "Team Required",
        description: "You need to select a team first",
        variant: "destructive",
      });
      return;
    }

    setNominating(true);
    try {
      const { data, error } = await supabase.functions.invoke('nominate_player', {
        body: { 
          roomId, 
          playerId: player.id,
          nominatedBy: myTeam.id,
          basePrice: player.base_price_cr
        }
      });

      if (error) throw error;

      toast({
        title: "Player Nominated!",
        description: `${player.name} has been nominated for auction`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to nominate player",
        variant: "destructive",
      });
    } finally {
      setNominating(false);
    }
  };

  const filteredPlayers = availablePlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roomStatus === 'waiting' && isHost) {
    return (
      <CricketCard variant="auction" className="mb-6">
        <CricketCardHeader>
          <CricketCardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Auction
          </CricketCardTitle>
        </CricketCardHeader>
        <CricketCardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Ready to begin the auction? All participants can start nominating players once you start.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {players.length} Teams
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ₹{players[0]?.purse_left_cr}Cr Budget
              </div>
            </div>
            <Button 
              onClick={handleStartAuction}
              disabled={starting || players.length < 2}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent"
            >
              {starting ? "Starting..." : "Start Auction"}
            </Button>
            {players.length < 2 && (
              <p className="text-sm text-amber-600">
                Need at least 2 teams to start the auction
              </p>
            )}
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  if (roomStatus === 'active') {
    return (
      <CricketCard variant="auction" className="mb-6">
        <CricketCardHeader>
          <div className="flex items-center justify-between">
            <CricketCardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Nominate Player
            </CricketCardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock className="h-3 w-3 mr-1" />
              Live Auction
            </Badge>
          </div>
        </CricketCardHeader>
        <CricketCardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name, role, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredPlayers.slice(0, 12).map((player) => (
              <div
                key={player.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.image_url || ''} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {player.role}
                        </Badge>
                        {player.is_overseas && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            OS
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Base</p>
                    <p className="font-medium text-sm">₹{player.base_price_cr}Cr</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleNominatePlayer(player)}
                  disabled={nominating || !myTeam}
                >
                  Nominate
                </Button>
              </div>
            ))}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players found matching your search</p>
            </div>
          )}
        </CricketCardContent>
      </CricketCard>
    );
  }

  return null;
};