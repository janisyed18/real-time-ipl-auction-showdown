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

    // Update room status to active
    const { error: roomError } = await supabaseClient
      .from('auction_rooms')
      .update({ status: 'active' })
      .eq('id', roomId);

    if (roomError) throw roomError;

    // Initialize current auction state
    const { error: auctionError } = await supabaseClient
      .from('current_auction')
      .upsert({
        room_id: roomId,
        phase: 'nomination',
        current_player_id: null,
        base_cr: 0,
        high_bid_cr: 0,
        high_team_id: null,
        nominated_by: null,
        turn_ends_at: null,
      });

    if (auctionError) throw auctionError;

    console.log('Auction started for room:', roomId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auction started successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error starting auction:', error);
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