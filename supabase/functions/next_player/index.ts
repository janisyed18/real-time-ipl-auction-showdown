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

    const { roomId } = await req.json();

    if (!roomId) {
      throw new Error('Missing roomId');
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

    // Get players already sold in this room
    const { data: soldPlayers } = await supabaseClient
      .from('roster')
      .select('player_id')
      .eq('room_id', roomId);

    const soldPlayerIds = soldPlayers?.map(p => p.player_id) || [];

    // Get all players
    const { data: allPlayers, error: playersError } = await supabaseClient
      .from('players')
      .select('*');

    if (playersError) {
      console.error('Players query error:', playersError);
      throw new Error('Error fetching available players');
    }

    // Filter out sold players
    const availablePlayers = allPlayers?.filter(player => 
      !soldPlayerIds.includes(player.id)
    ) || [];

    if (!availablePlayers || availablePlayers.length === 0) {
      throw new Error('No more players available for auction');
    }

    // Select a random player
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    
    // Base price is the player's base price (already updated to max 2cr)
    const basePrice = randomPlayer.base_price_cr;

    // Calculate turn end time (bid duration)
    const turnEndsAt = new Date(Date.now() + (room.bid_turn_seconds * 1000));

    // Update auction state to start bidding
    const { error: updateError } = await supabaseClient
      .from('current_auction')
      .update({
        phase: 'bidding',
        current_player_id: randomPlayer.id,
        base_cr: basePrice,
        high_bid_cr: basePrice,
        high_team_id: null, // No initial bidder - AI can start bidding
        nominated_by: null, // Auto-selected
        turn_ends_at: turnEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId);

    if (updateError) {
      throw updateError;
    }

    // No initial bid needed - teams will start bidding from base price
    console.log(`Auto-selected player: ${randomPlayer.name} for auction in room ${roomId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Next player selected for auction',
        player: {
          id: randomPlayer.id,
          name: randomPlayer.name,
          role: randomPlayer.role,
          base_price: basePrice,
          is_overseas: randomPlayer.is_overseas,
          image_url: randomPlayer.image_url,
          country: randomPlayer.country
        },
        auction: {
          phase: 'bidding',
          base_price: basePrice,
          turn_ends_at: turnEndsAt.toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in next_player:', error);
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