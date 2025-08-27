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
    console.log('Starting auction for room:', roomId);
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('start_auction', {
        body: { roomId }
      });

      console.log('Start auction response:', { data, error });

      if (error) throw error;

      toast({
        title: "Auction Started!",
        description: "The auction is now live. Players can start nominating.",
      });
    } catch (error: any) {
      console.error('Start auction error:', error);
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
              Auto Auction
            </CricketCardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock className="h-3 w-3 mr-1" />
              Live Auction
            </Badge>
          </div>
        </CricketCardHeader>
        <CricketCardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Players are automatically selected for auction. Use the bidding interface to bid or skip.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {availablePlayers.length} Players Available
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Max ₹2Cr Base Price
              </div>
            </div>
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  return null;
};