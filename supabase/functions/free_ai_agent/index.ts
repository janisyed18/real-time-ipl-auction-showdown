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

    const { roomId, decision, context } = await req.json();

    if (!roomId || !decision) {
      throw new Error('Room ID and decision type are required');
    }

    // Get AI teams in the room
    const { data: aiTeams, error: teamsError } = await supabaseClient
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_ai', true);

    if (teamsError) throw teamsError;

    console.log('AI teams found:', aiTeams?.length);

    let result;
    switch (decision) {
      case 'nomination':
        result = await makeNominationDecision(supabaseClient, roomId, aiTeams || []);
        break;
      case 'bidding':
        result = await makeBiddingDecision(supabaseClient, roomId, aiTeams || [], context);
        break;
      default:
        throw new Error('Invalid decision type');
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in free AI agent:', error);
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

async function makeNominationDecision(supabaseClient: any, roomId: string, aiTeams: any[]) {
  // Get available players (not in this room's roster)
  const { data: availablePlayers, error: playersError } = await supabaseClient
    .from('players')
    .select('*')
    .not('id', 'in', `(SELECT player_id FROM rosters WHERE room_id = '${roomId}')`);

  if (playersError) throw playersError;

  if (!availablePlayers || availablePlayers.length === 0) {
    return {
      action: 'skip',
      reasoning: 'No available players to nominate'
    };
  }

  // Select a random AI team to nominate
  const nominatingTeam = aiTeams[Math.floor(Math.random() * aiTeams.length)];
  
  // Select a random player to nominate
  const selectedPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
  
  // Use simple logic for starting price (base price + 0-50% randomly)
  const basePrice = selectedPlayer.base_price || 10;
  const randomMultiplier = 1 + (Math.random() * 0.5); // 1.0 to 1.5
  const startingPrice = Math.round(basePrice * randomMultiplier);

  console.log(`Free AI nominating ${selectedPlayer.name} for ${startingPrice} cr by team ${nominatingTeam.team_name}`);

  return {
    action: 'nominate',
    playerId: selectedPlayer.id,
    teamId: nominatingTeam.id,
    startingPrice: startingPrice,
    reasoning: `Free AI nominated ${selectedPlayer.name} (${selectedPlayer.role}) for ${startingPrice} cr`
  };
}

async function makeBiddingDecision(supabaseClient: any, roomId: string, aiTeams: any[], context: any) {
  console.log('Free AI making bidding decision with context:', context);

  const currentAuction = context?.currentAuction;
  const currentPlayer = context?.currentPlayer;
  
  if (!currentAuction || !currentPlayer) {
    return {
      action: 'skip',
      reasoning: 'No current auction or player data available'
    };
  }

  const currentHighBid = currentAuction.high_bid_cr || currentAuction.base_cr;
  const currentHighBidder = currentAuction.high_team_id;

  // Filter AI teams that can bid (have budget, slots, and aren't current high bidder)
  const eligibleTeams = aiTeams.filter(team => {
    const hasSlots = (team.slots_filled || 0) < (team.max_slots || 11);
    const hasOverseasSlots = !currentPlayer.is_overseas || 
      (team.overseas_slots_filled || 0) < (team.max_overseas_slots || 4);
    const hasBudget = (team.budget || 0) > currentHighBid + 5; // Can afford minimum increment
    const notCurrentBidder = team.id !== currentHighBidder;
    
    return hasSlots && hasOverseasSlots && hasBudget && notCurrentBidder;
  });

  if (eligibleTeams.length === 0) {
    return {
      action: 'skip',
      reasoning: 'No eligible AI teams can bid'
    };
  }

  // Random decision making (simple logic)
  const shouldBid = Math.random() > 0.4; // 60% chance to bid
  
  if (!shouldBid) {
    return {
      action: 'skip',
      reasoning: 'Free AI decided not to bid this round'
    };
  }

  // Select random team to bid
  const biddingTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
  
  // Calculate bid amount (current + 5 to 15 cr increment)
  const increment = 5 + Math.floor(Math.random() * 11); // 5-15 cr
  const bidAmount = currentHighBid + increment;
  
  // Ensure bid doesn't exceed team budget
  const finalBidAmount = Math.min(bidAmount, biddingTeam.budget - 5); // Keep 5cr buffer

  console.log(`Free AI team ${biddingTeam.team_name} bidding ${finalBidAmount} cr`);

  return {
    action: 'bid',
    bidAmount: finalBidAmount,
    teamId: biddingTeam.id,
    reasoning: `Free AI team ${biddingTeam.team_name} bid ${finalBidAmount} cr`
  };
}