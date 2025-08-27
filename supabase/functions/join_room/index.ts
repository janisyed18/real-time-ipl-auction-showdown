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

    const { roomId, userId, nickname, teamId } = await req.json();

    if (!roomId || !userId || !nickname || !teamId) {
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

    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players');
    }

    // Check if user is already in the room
    const { data: existingPlayer } = await supabaseClient
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      throw new Error('User already in room');
    }

    // Check if team is already taken
    const { data: existingTeam } = await supabaseClient
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('team_id', teamId)
      .single();

    if (existingTeam) {
      throw new Error('Team already taken');
    }

    // Check room capacity (max 10 teams)
    const { count } = await supabaseClient
      .from('room_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (count && count >= 10) {
      throw new Error('Room is full');
    }

    // Join the room
    const { data: newPlayer, error: joinError } = await supabaseClient
      .from('room_players')
      .insert({
        room_id: roomId,
        user_id: userId,
        nickname,
        team_id: teamId,
        purse_left_cr: room.purse_cr,
        slots_left: room.squad_max,
        overseas_in_squad: 0,
      })
      .select('*')
      .single();

    if (joinError) {
      throw joinError;
    }

    // Initialize current_auction for the room if it doesn't exist
    const { error: auctionError } = await supabaseClient
      .from('current_auction')
      .upsert({
        room_id: roomId,
        phase: 'idle',
      }, {
        onConflict: 'room_id',
        ignoreDuplicates: true,
      });

    if (auctionError) {
      console.warn('Could not initialize auction:', auctionError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        player: newPlayer,
        message: 'Successfully joined room' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in join_room:', error);
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