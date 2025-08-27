import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { roomId, teamId, bidAmount } = await req.json();

    if (!roomId || !teamId || bidAmount === undefined) {
      throw new Error('Missing required fields');
    }

    // Get room details
    const { data: room, error: roomError } = await supabaseClient
      .from('auction_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'active') {
      throw new Error('Auction is not active');
    }

    // Get current auction state
    const { data: currentAuction, error: auctionError } = await supabaseClient
      .from('current_auction')
      .select('*, current_player:players(*)')
      .eq('room_id', roomId)
      .single();

    if (auctionError || !currentAuction) {
      throw new Error('No active auction');
    }

    if (currentAuction.phase !== 'bidding') {
      throw new Error('Not in bidding phase');
    }

    // Check if auction has expired
    if (new Date() > new Date(currentAuction.turn_ends_at)) {
      throw new Error('Bidding time has expired');
    }

    // Get bidding team details
    const { data: biddingTeam, error: teamError } = await supabaseClient
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('team_id', teamId)
      .single();

    if (teamError || !biddingTeam) {
      throw new Error('Team not found in room');
    }

    // Validate bid increment
    const currentBid = currentAuction.high_bid_cr;
    const minIncrement = currentBid < 5 ? 0.2 : 0.5;
    const minNextBid = currentBid + minIncrement;

    if (bidAmount < minNextBid) {
      throw new Error(`Minimum bid is ₹${minNextBid} Cr`);
    }

    // Check if team can afford this bid
    const player = currentAuction.current_player;
    if (!player) {
      throw new Error('No player being auctioned');
    }

    // Calculate minimum budget needed for remaining slots
    const remainingSlotsAfterPurchase = biddingTeam.slots_left - 1;
    const minBudgetForRemainingSlots = remainingSlotsAfterPurchase * 0.2; // ₹0.2 Cr minimum per slot

    if (biddingTeam.purse_left_cr - bidAmount < minBudgetForRemainingSlots) {
      throw new Error('Insufficient budget for remaining squad slots');
    }

    // Check overseas player limit
    if (player.is_overseas) {
      if (biddingTeam.overseas_in_squad >= room.overseas_max) {
        throw new Error('Overseas player limit reached');
      }
    }

    // Calculate new turn end time (extend by bid timer)
    const newTurnEndsAt = new Date(Date.now() + (room.bid_turn_seconds * 1000));

    // Update auction state with new high bid
    const { error: updateError } = await supabaseClient
      .from('current_auction')
      .update({
        high_bid_cr: bidAmount,
        high_team_id: teamId,
        turn_ends_at: newTurnEndsAt.toISOString(),
      })
      .eq('room_id', roomId);

    if (updateError) {
      throw updateError;
    }

    // Insert the bid record
    const { error: bidError } = await supabaseClient
      .from('bids')
      .insert({
        room_id: roomId,
        player_id: currentAuction.current_player_id,
        team_id: teamId,
        amount_cr: bidAmount,
      });

    if (bidError) {
      throw bidError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bid placed successfully',
        auction: {
          high_bid: bidAmount,
          high_bidder: teamId,
          turn_ends_at: newTurnEndsAt.toISOString(),
          min_next_bid: bidAmount + minIncrement,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in place_bid:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});