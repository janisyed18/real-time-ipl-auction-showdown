import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionStore } from '@/store/auctionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Timer, Gavel, Crown, TrendingUp, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Team } from '@/types/auction';

interface AuctionInterfaceProps {
  roomId: string;
  myTeam: Team | null;
  players: Player[];
}

export const AuctionInterface: React.FC<AuctionInterfaceProps> = ({
  roomId,
  myTeam,
  players,
}) => {
  const { currentAuction, bids } = useAuctionStore();
  const { toast } = useToast();
  
  const [bidAmount, setBidAmount] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [basePrice, setBasePrice] = useState<string>('');
  const [isNominating, setIsNominating] = useState(false);

  // Current player being auctioned
  const currentPlayer = players.find(p => p.id === currentAuction?.current_player_id);
  
  // Calculate time remaining
  useEffect(() => {
    if (!currentAuction?.turn_ends_at) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(currentAuction.turn_ends_at).getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(Math.ceil(remaining / 1000));

      // Auto-finalize if time is up
      if (remaining <= 0 && currentAuction.phase === 'bidding') {
        finalizeSale();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentAuction?.turn_ends_at, currentAuction?.phase]);

  // Update bid amount when auction changes
  useEffect(() => {
    if (currentAuction?.high_bid_cr) {
      const minIncrement = currentAuction.high_bid_cr < 5 ? 0.2 : 0.5;
      const minNextBid = currentAuction.high_bid_cr + minIncrement;
      setBidAmount(minNextBid.toFixed(2));
    }
  }, [currentAuction?.high_bid_cr]);

  const nominatePlayer = async () => {
    if (!selectedPlayer || !myTeam || !basePrice) return;

    setIsNominating(true);
    try {
      const { data, error } = await supabase.functions.invoke('nominate_player', {
        body: {
          roomId,
          playerId: selectedPlayer.id,
          nominatedBy: myTeam.id,
          basePrice: parseFloat(basePrice),
        },
      });

      if (error) throw error;

      toast({
        title: "Player Nominated!",
        description: `${selectedPlayer.name} is now up for auction`,
      });

      setSelectedPlayer(null);
      setBasePrice('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsNominating(false);
    }
  };

  const placeBid = async () => {
    if (!myTeam || !bidAmount) return;

    setIsPlacingBid(true);
    try {
      const { data, error } = await supabase.functions.invoke('place_bid', {
        body: {
          roomId,
          teamId: myTeam.id,
          bidAmount: parseFloat(bidAmount),
        },
      });

      if (error) throw error;

      toast({
        title: "Bid Placed!",
        description: `₹${bidAmount} Cr bid placed successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const finalizeSale = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('finalize_sale', {
        body: { roomId },
      });

      if (error) throw error;

      if (data.result.sold) {
        toast({
          title: "Player Sold!",
          description: `${data.result.player_name} sold to ${data.result.winning_team?.short_name} for ₹${data.result.final_price} Cr`,
        });
      } else {
        toast({
          title: "Player Unsold",
          description: `${data.result.player_name} went unsold`,
        });
      }
    } catch (error: any) {
      console.error('Error finalizing sale:', error);
    }
  };

  const canBid = myTeam && currentAuction?.phase === 'bidding' && 
    currentAuction.high_team_id !== myTeam.id && timeLeft > 0;

  const canNominate = myTeam && currentAuction?.phase === 'idle';

  // Get current high bidder team
  const highBidderTeam = currentAuction?.high_team_id;
  const isMyBid = highBidderTeam === myTeam?.id;

  if (currentAuction?.phase === 'bidding' && currentPlayer) {
    return (
      <CricketCard variant="glow" className="mb-6">
        <CricketCardHeader>
          <div className="flex items-center justify-between">
            <CricketCardTitle className="text-xl">
              {currentPlayer.name} - {currentPlayer.role}
              {currentPlayer.is_overseas && (
                <Badge variant="secondary" className="ml-2">Overseas</Badge>
              )}
            </CricketCardTitle>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeLeft <= 5 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
              }`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono font-bold">{timeLeft}s</span>
              </div>
              {timeLeft <= 5 && (
                <div className="animate-pulse">
                  <Target className="h-5 w-5 text-destructive" />
                </div>
              )}
            </div>
          </div>
        </CricketCardHeader>
        <CricketCardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Bid Status */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  ₹{currentAuction.high_bid_cr} Cr
                </div>
                <p className="text-muted-foreground">
                  Current Highest Bid
                  {isMyBid && (
                    <Badge variant="secondary" className="ml-2">Your Bid</Badge>
                  )}
                </p>
              </div>

              {/* Bid History */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Bids
                </h4>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {bids
                    .filter(bid => bid.player_id === currentPlayer.id)
                    .slice(-3)
                    .reverse()
                    .map((bid, index) => (
                      <div key={bid.id} className="flex justify-between text-sm">
                        <span>₹{bid.amount_cr} Cr</span>
                        <span className="text-muted-foreground">Team</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Bidding Controls */}
            <div className="space-y-4">
              {canBid && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Your Bid (₹ Crores)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min={currentAuction.high_bid_cr + (currentAuction.high_bid_cr < 5 ? 0.2 : 0.5)}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter bid amount"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={placeBid}
                      disabled={isPlacingBid || !bidAmount || parseFloat(bidAmount) <= currentAuction.high_bid_cr}
                      className="bg-gradient-to-r from-green-600 to-green-500 text-white"
                    >
                      <Gavel className="mr-2 h-4 w-4" />
                      {isPlacingBid ? 'Bidding...' : 'BID'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      SKIP
                    </Button>
                  </div>
                </>
              )}

              {!canBid && myTeam && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  {isMyBid ? (
                    <div className="text-green-600 font-medium">
                      <Crown className="h-5 w-5 inline mr-2" />
                      You have the highest bid!
                    </div>
                  ) : timeLeft <= 0 ? (
                    <div className="text-muted-foreground">
                      Bidding time expired
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Wait for other bidders
                    </div>
                  )}
                </div>
              )}

              {!myTeam && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    Select a team to participate in bidding
                  </p>
                </div>
              )}
            </div>
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  if (canNominate) {
    const handleNextPlayer = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('next_player', {
          body: { roomId }
        });

        if (error) throw error;

        toast({
          title: "Next Player Selected!",
          description: `${data.player.name} is now up for auction`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    return (
      <CricketCard variant="auction" className="mb-6">
        <CricketCardHeader>
          <CricketCardTitle>Next Player</CricketCardTitle>
        </CricketCardHeader>
        <CricketCardContent>
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Click below to automatically select the next player for auction
            </p>
            <Button
              onClick={handleNextPlayer}
              disabled={isNominating}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              {isNominating ? 'Selecting...' : 'Select Next Player'}
            </Button>
          </div>
        </CricketCardContent>
      </CricketCard>
    );
  }

  return (
    <CricketCard variant="auction" className="mb-6">
      <CricketCardContent>
        <div className="text-center py-8">
          <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Auction Ready</h3>
          <p className="text-muted-foreground">
            {myTeam ? 'Waiting for player nomination...' : 'Select a team to participate'}
          </p>
        </div>
      </CricketCardContent>
    </CricketCard>
  );
};