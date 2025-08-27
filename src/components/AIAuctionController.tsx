import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionStore } from '@/store/auctionStore';
import { useToast } from '@/hooks/use-toast';

interface AIAuctionControllerProps {
  roomId: string;
  isActive: boolean;
}

export const AIAuctionController: React.FC<AIAuctionControllerProps> = ({
  roomId,
  isActive,
}) => {
  const { currentAuction, players, availablePlayers } = useAuctionStore();
  const { toast } = useToast();
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<string>('');

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Monitor auction state for AI actions
  useEffect(() => {
    console.log('AIAuctionController: Checking state...', {
      isActive,
      currentAuction,
      roomId,
      phase: currentAuction?.phase,
      playerId: currentAuction?.current_player_id
    });

    if (!isActive || !currentAuction || !roomId) {
      console.log('AIAuctionController: Not active or missing data');
      return;
    }

    const actionKey = `${currentAuction.phase}_${currentAuction.current_player_id}_${currentAuction.high_bid_cr}`;
    
    // Prevent duplicate actions
    if (lastActionRef.current === actionKey) {
      console.log('AIAuctionController: Duplicate action prevented', actionKey);
      return;
    }
    
    console.log('AIAuctionController: New action needed', actionKey);
    lastActionRef.current = actionKey;

    // Clear any existing timeout
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    // Check if we need AI action
    if (currentAuction.phase === 'idle') {
      console.log('AIAuctionController: Scheduling AI nomination');
      // AI should nominate a player if no human has nominated recently
      scheduleAINomination();
    } else if (currentAuction.phase === 'bidding') {
      console.log('AIAuctionController: Scheduling AI bidding');
      // AI should consider bidding
      scheduleAIBidding();
    }
  }, [currentAuction, isActive, roomId]);

  const scheduleAINomination = () => {
    // Wait 3-8 seconds before AI nominates (random delay for realism)
    const delay = Math.random() * 5000 + 3000;
    
    aiTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('AI attempting to nominate player...');
        
        const { data, error } = await supabase.functions.invoke('ai_agent', {
          body: {
            roomId,
            decision: 'nominate',
            context: {
              availablePlayers: availablePlayers.slice(0, 20), // Send top 20 for performance
              overseasMax: 8, // Default from room settings
            },
          },
        });

        if (error) throw error;

        if (data.result?.action === 'nominate') {
          console.log('AI nominating:', data.result);
          
          // Execute the nomination through our existing function
          const { error: nominateError } = await supabase.functions.invoke('nominate_player', {
            body: {
              roomId,
              playerId: data.result.player_id,
              nominatedBy: data.result.team_id,
              basePrice: data.result.starting_price,
            },
          });

          if (nominateError) throw nominateError;

          toast({
            title: "AI Nomination",
            description: `AI agent nominated a player for ₹${data.result.starting_price} Cr`,
          });
        }
      } catch (error: any) {
        console.error('AI nomination error:', error);
        // Don't show error toast for AI failures, just log them
      }
    }, delay);
  };

  const scheduleAIBidding = () => {
    console.log('AIAuctionController: scheduleAIBidding called', currentAuction);
    if (!currentAuction?.turn_ends_at) {
      console.log('AIAuctionController: No turn_ends_at, skipping AI bidding');
      return;
    }

    // Calculate when AI should bid (random time before auction ends)
    const auctionEndTime = new Date(currentAuction.turn_ends_at).getTime();
    const now = Date.now();
    const timeRemaining = auctionEndTime - now;
    
    console.log('AIAuctionController: Time remaining for AI bid:', timeRemaining);
    
    if (timeRemaining <= 0) {
      console.log('AIAuctionController: Auction already ended');
      return; // Auction already ended
    }

    // AI bids between 2-6 seconds before auction ends
    const bidDelay = Math.max(1000, timeRemaining - (Math.random() * 4000 + 2000));
    
    console.log('AIAuctionController: Will attempt AI bid in', bidDelay, 'ms');
    
    aiTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('AIAuctionController: AI considering bid...');

        // Get current player stats for context
        const currentPlayer = availablePlayers.find(p => p.id === currentAuction.current_player_id);
        const playerStats = (currentPlayer as any)?.stats?.[0];

        const { data, error } = await supabase.functions.invoke('ai_agent', {
          body: {
            roomId,
            decision: 'bid',
            context: {
              currentAuction,
              currentPlayer,
              playerStats,
              overseasMax: 8,
            },
          },
        });

        if (error) throw error;

        if (data.result?.action === 'bid') {
          console.log('AI placing bid:', data.result);
          
          // Execute the bid through our existing function
          const { error: bidError } = await supabase.functions.invoke('place_bid', {
            body: {
              roomId,
              teamId: data.result.team_id,
              bidAmount: data.result.bid_amount,
            },
          });

          if (bidError) throw bidError;

          toast({
            title: "AI Bid",
            description: `AI agent bid ₹${data.result.bid_amount} Cr`,
          });
        } else {
          console.log('AI decided not to bid:', data.result?.reasoning);
        }
      } catch (error: any) {
        console.error('AI bidding error:', error);
        // Don't show error toast for AI failures
      }
    }, bidDelay);
  };

  // This component doesn't render anything - it's just for controlling AI behavior
  return null;
};