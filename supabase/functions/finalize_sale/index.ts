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
      throw new Error('Room ID is required');
    }

    // Get current auction state
    const { data: currentAuction, error: auctionError } = await supabaseClient
      .from('current_auction')
      .select('*, current_player:players(*)')
      .eq('room_id', roomId)
      .single();

    if (auctionError || !currentAuction) {
      throw new Error('No active auction found');
    }

    if (currentAuction.phase !== 'bidding') {
      throw new Error('Not in bidding phase');
    }

    // Check if bidding time has actually expired
    if (new Date() <= new Date(currentAuction.turn_ends_at)) {
      throw new Error('Bidding time has not expired yet');
    }

    const player = currentAuction.current_player;
    const winningTeamId = currentAuction.high_team_id;
    const finalPrice = currentAuction.high_bid_cr;

    let result = {
      sold: false,
      player_name: player?.name,
      final_price: finalPrice,
      winning_team: null as any,
    };

    // If there's a winning team (bid above base price)
    if (winningTeamId && finalPrice > 0) {
      // Get winning team details
      const { data: winningTeam, error: teamError } = await supabaseClient
        .from('room_players')
        .select('*, team:teams(*)')
        .eq('room_id', roomId)
        .eq('team_id', winningTeamId)
        .single();

      if (teamError || !winningTeam) {
        throw new Error('Winning team not found');
      }

      // Add player to roster
      const { error: rosterError } = await supabaseClient
        .from('roster')
        .insert({
          room_id: roomId,
          team_id: winningTeamId,
          player_id: currentAuction.current_player_id,
          role: player.role,
          is_overseas: player.is_overseas,
          price_cr: finalPrice,
        });

      if (rosterError) {
        throw rosterError;
      }

      // Update team's purse and slots
      const newPurse = winningTeam.purse_left_cr - finalPrice;
      const newSlots = winningTeam.slots_left - 1;
      const newOverseas = winningTeam.overseas_in_squad + (player.is_overseas ? 1 : 0);

      const { error: updateTeamError } = await supabaseClient
        .from('room_players')
        .update({
          purse_left_cr: newPurse,
          slots_left: newSlots,
          overseas_in_squad: newOverseas,
        })
        .eq('room_id', roomId)
        .eq('team_id', winningTeamId);

      if (updateTeamError) {
        throw updateTeamError;
      }

      result = {
        sold: true,
        player_name: player?.name,
        final_price: finalPrice,
        winning_team: winningTeam.team,
      };
    }

    // Reset auction to idle state
    const { error: resetError } = await supabaseClient
      .from('current_auction')
      .update({
        phase: 'idle',
        current_player_id: null,
        base_cr: null,
        high_bid_cr: null,
        high_team_id: null,
        nominated_by: null,
        turn_ends_at: null,
      })
      .eq('room_id', roomId);

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: result.sold ? 'Player sold successfully' : 'Player went unsold',
        result: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in finalize_sale:', error);
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