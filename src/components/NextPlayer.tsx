import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkipForward, Shuffle, Clock, DollarSign, Star } from 'lucide-react';
import { useAuctionStore } from '@/store/auctionStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NextPlayerProps {
  roomId: string;
  isHost: boolean;
  roomStatus: string;
  currentAuction: any;
}

export const NextPlayer: React.FC<NextPlayerProps> = ({ 
  roomId, 
  isHost, 
  roomStatus, 
  currentAuction 
}) => {
  const { availablePlayers } = useAuctionStore();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState(false);

  const handleSelectNextPlayer = async () => {
    console.log('Selecting next player for room:', roomId);
    setSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('next_player', {
        body: { roomId }
      });

      console.log('Next player response:', { data, error });

      if (error) throw error;

      toast({
        title: "Player Selected!",
        description: `${data.player.name} is now up for auction`,
      });
    } catch (error: any) {
      console.error('Select next player error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to select next player",
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  // Only show for host when auction is active and in idle phase
  if (!isHost || roomStatus !== 'active' || currentAuction?.phase !== 'idle') {
    return null;
  }

  return (
    <CricketCard variant="auction" className="mb-4">
      <CricketCardHeader>
        <CricketCardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Select Next Player
        </CricketCardTitle>
      </CricketCardHeader>
      <CricketCardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Ready to auction the next player? The system will randomly select a player for bidding.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {availablePlayers.length} Players Available
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              12s Bid Timer
            </div>
          </div>
          <Button 
            onClick={handleSelectNextPlayer}
            disabled={selecting || availablePlayers.length === 0}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {selecting ? (
              <>
                <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4 mr-2" />
                Select Next Player
              </>
            )}
          </Button>
          {availablePlayers.length === 0 && (
            <p className="text-sm text-amber-600">
              No more players available for auction
            </p>
          )}
        </div>
      </CricketCardContent>
    </CricketCard>
  );
};