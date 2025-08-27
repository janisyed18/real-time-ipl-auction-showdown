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

    const { roomId, playerId, nominatedBy, basePrice } = await req.json();

    if (!roomId || !playerId || !nominatedBy || basePrice === undefined) {
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

    // Check if player exists and is not already sold
    const { data: player, error: playerError } = await supabaseClient
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      throw new Error('Player not found');
    }

    // Check if player is already in any team's roster for this room
    const { data: existingRoster } = await supabaseClient
      .from('roster')
      .select('id')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .single();

    if (existingRoster) {
      throw new Error('Player already sold');
    }

    // Verify the nominating team is in the room
    const { data: nominatingTeam, error: teamError } = await supabaseClient
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('team_id', nominatedBy)
      .single();

    if (teamError || !nominatingTeam) {
      throw new Error('Nominating team not found in room');
    }

    // Check current auction state
    const { data: currentAuction, error: auctionError } = await supabaseClient
      .from('current_auction')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (auctionError || !currentAuction) {
      throw new Error('Auction state not found');
    }

    if (currentAuction.phase !== 'idle') {
      throw new Error('Another player is currently being auctioned');
    }

    // Validate base price (should be at least player's minimum base price)
    const minBasePrice = Math.max(player.base_price_cr, 0.2);
    if (basePrice < minBasePrice) {
      throw new Error(`Base price must be at least ₹${minBasePrice} Cr`);
    }

    // Calculate turn end time
    const turnEndsAt = new Date(Date.now() + (room.bid_turn_seconds * 1000));

    // Update auction state to start bidding
    const { error: updateError } = await supabaseClient
      .from('current_auction')
      .update({
        phase: 'bidding',
        current_player_id: playerId,
        base_cr: basePrice,
        high_bid_cr: basePrice,
        high_team_id: nominatedBy,
        nominated_by: nominatedBy,
        turn_ends_at: turnEndsAt.toISOString(),
      })
      .eq('room_id', roomId);

    if (updateError) {
      throw updateError;
    }

    // Insert the initial bid
    const { error: bidError } = await supabaseClient
      .from('bids')
      .insert({
        room_id: roomId,
        player_id: playerId,
        team_id: nominatedBy,
        amount_cr: basePrice,
      });

    if (bidError) {
      console.warn('Could not insert initial bid:', bidError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Player nominated successfully',
        auction: {
          phase: 'bidding',
          player_id: playerId,
          base_price: basePrice,
          current_bid: basePrice,
          high_bidder: nominatedBy,
          turn_ends_at: turnEndsAt.toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in nominate_player:', error);
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