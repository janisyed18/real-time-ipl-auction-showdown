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

    const { roomId, count = 1 } = await req.json();

    if (!roomId) {
      throw new Error('Room ID is required');
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

    // Get current participants
    const { data: existingPlayers, error: playersError } = await supabaseClient
      .from('room_players')
      .select('team_id')
      .eq('room_id', roomId);

    if (playersError) throw playersError;

    // Get available teams
    const { data: allTeams, error: teamsError } = await supabaseClient
      .from('teams')
      .select('*')
      .order('short_name');

    if (teamsError) throw teamsError;

    const takenTeamIds = new Set(existingPlayers.map(p => p.team_id));
    const availableTeams = allTeams.filter(team => !takenTeamIds.has(team.id));

    if (availableTeams.length === 0) {
      throw new Error('No available teams for AI agents');
    }

    const aiAgentNames = [
      'AI Scout Alpha', 'AI Strategist Beta', 'AI Manager Gamma', 
      'AI Analyst Delta', 'AI Coach Epsilon', 'AI Director Zeta',
      'AI Mentor Eta', 'AI Tactician Theta', 'AI Planner Iota', 'AI Expert Kappa'
    ];

    const addedAgents = [];
    const agentsToAdd = Math.min(count, availableTeams.length);

    for (let i = 0; i < agentsToAdd; i++) {
      const team = availableTeams[i];
      const agentName = aiAgentNames[i] || `AI Agent ${i + 1}`;

      // Generate a proper UUID for the AI agent
      const aiUserId = crypto.randomUUID();

      // Add AI agent to room
      const { data: newAgent, error: agentError } = await supabaseClient
        .from('room_players')
        .insert({
          room_id: roomId,
          user_id: aiUserId, // Use proper UUID
          nickname: agentName,
          team_id: team.id,
          purse_left_cr: room.purse_cr,
          slots_left: room.squad_max,
          overseas_in_squad: 0,
          is_ai: true, // Mark as AI agent
        })
        .select('*, team:teams(*)')
        .single();

      if (agentError) {
        console.warn(`Failed to add AI agent ${agentName}:`, agentError);
        continue;
      }

      addedAgents.push(newAgent);
      console.log(`Added AI agent: ${agentName} as ${team.short_name}`);
    }

    if (addedAgents.length === 0) {
      throw new Error('Failed to add any AI agents');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${addedAgents.length} AI agent(s)`,
        agents: addedAgents
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in add_ai_agents:', error);
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