import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionStore } from '@/store/auctionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Timer, Gavel, Crown, TrendingUp, Target, Globe } from 'lucide-react';
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
    // Get player stats
    const playerStats = (currentPlayer as any)?.stats?.[0];
    
    return (
      <CricketCard variant="glow" className="mb-6">
        <CricketCardHeader>
          <div className="flex items-center justify-between">
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Card with Photo and Details */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-border/50">
                {/* Player Photo */}
                <div className="relative mb-4">
                  <div className="w-32 h-40 mx-auto bg-muted/50 rounded-lg overflow-hidden border-2 border-primary/20">
                    {currentPlayer.image_url ? (
                      <img 
                        src={currentPlayer.image_url} 
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <span className="text-4xl font-bold text-primary/60">
                          {currentPlayer.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {currentPlayer.is_marquee && (
                      <div className="absolute -top-2 -right-2">
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Name and Role */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {currentPlayer.name}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      {currentPlayer.role}
                    </Badge>
                    {currentPlayer.is_overseas && (
                      <Badge variant="secondary" className="bg-accent/20">
                        <Globe className="h-3 w-3 mr-1" />
                        Overseas
                      </Badge>
                    )}
                    {currentPlayer.country && (
                      <Badge variant="outline" className="text-xs">
                        {currentPlayer.country}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Base Price */}
                <div className="text-center mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Base Price</div>
                  <div className="text-lg font-bold flex items-center justify-center gap-1">
                    <span>₹{currentPlayer.base_price_cr} Cr</span>
                  </div>
                </div>

                {/* Player Stats */}
                {playerStats && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-center text-sm">IPL Stats</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {currentPlayer.role.includes('Batter') || currentPlayer.role === 'All-rounder' || currentPlayer.role === 'WK' ? (
                        <>
                          <div className="text-center p-2 bg-muted/20 rounded">
                            <div className="font-semibold">{playerStats.batting_avg?.toFixed(1) || 'N/A'}</div>
                            <div className="text-muted-foreground">Avg</div>
                          </div>
                          <div className="text-center p-2 bg-muted/20 rounded">
                            <div className="font-semibold">{playerStats.batting_sr?.toFixed(1) || 'N/A'}</div>
                            <div className="text-muted-foreground">SR</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center p-2 bg-muted/20 rounded">
                            <div className="font-semibold">{playerStats.bowling_econ?.toFixed(1) || 'N/A'}</div>
                            <div className="text-muted-foreground">Econ</div>
                          </div>
                          <div className="text-center p-2 bg-muted/20 rounded">
                            <div className="font-semibold">{playerStats.bowling_sr?.toFixed(1) || 'N/A'}</div>
                            <div className="text-muted-foreground">SR</div>
                          </div>
                        </>
                      )}
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-semibold">{playerStats.matches_played || 0}</div>
                        <div className="text-muted-foreground">Matches</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-semibold">{playerStats.recent_form || 'N/A'}</div>
                        <div className="text-muted-foreground">Form</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Bid Status */}
            <div className="lg:col-span-1 space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
                  ₹{currentAuction.high_bid_cr} Cr
                </div>
                <p className="text-green-600 dark:text-green-300 font-medium">
                  Current Highest Bid
                  {isMyBid && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      Your Bid
                    </Badge>
                  )}
                </p>
              </div>

              {/* Bid History */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Bids
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2 bg-muted/30 rounded-lg p-3">
                  {bids
                    .filter(bid => bid.player_id === currentPlayer.id)
                    .slice(-5)
                    .reverse()
                    .map((bid, index) => (
                      <div key={bid.id} className="flex justify-between text-sm bg-background/60 p-2 rounded border">
                        <span className="font-medium">₹{bid.amount_cr} Cr</span>
                        <span className="text-muted-foreground">Team {index + 1}</span>
                      </div>
                    ))}
                  {bids.filter(bid => bid.player_id === currentPlayer.id).length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-2">
                      No bids yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bidding Controls */}
            <div className="lg:col-span-1 space-y-4">
              {canBid && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50 space-y-4">
                  <h4 className="font-semibold text-center text-blue-700 dark:text-blue-300">Place Your Bid</h4>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-blue-600 dark:text-blue-300">
                      Bid Amount (₹ Crores)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min={currentAuction.high_bid_cr + (currentAuction.high_bid_cr < 5 ? 0.2 : 0.5)}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter bid amount"
                      className="border-blue-200 dark:border-blue-800 focus:border-blue-400 dark:focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={placeBid}
                      disabled={isPlacingBid || !bidAmount || parseFloat(bidAmount) <= currentAuction.high_bid_cr}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3"
                      size="lg"
                    >
                      <Gavel className="mr-2 h-5 w-5" />
                      {isPlacingBid ? 'Placing Bid...' : 'PLACE BID'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 font-medium py-3"
                      size="lg"
                    >
                      SKIP
                    </Button>
                  </div>
                </div>
              )}

              {!canBid && myTeam && (
                <div className="text-center p-6 bg-muted/50 rounded-xl border">
                  {isMyBid ? (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      <Crown className="h-6 w-6 inline mr-2" />
                      You have the highest bid!
                    </div>
                  ) : timeLeft <= 0 ? (
                    <div className="text-muted-foreground">
                      <Target className="h-6 w-6 inline mr-2" />
                      Bidding time expired
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Timer className="h-6 w-6 inline mr-2" />
                      Wait for other bidders
                    </div>
                  )}
                </div>
              )}

              {!myTeam && (
                <div className="text-center p-6 bg-muted/50 rounded-xl border">
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