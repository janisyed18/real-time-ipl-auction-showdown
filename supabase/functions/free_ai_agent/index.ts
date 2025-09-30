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
  if (!aiTeams || aiTeams.length === 0) {
    return {
      action: 'skip',
      reasoning: 'No AI teams available to nominate'
    };
  }

  // Get available players (not in this room's roster)
  const { data: rosterPlayers } = await supabaseClient
    .from('roster')
    .select('player_id')
    .eq('room_id', roomId);

  const soldPlayerIds = rosterPlayers?.map((r: any) => r.player_id) || [];

  const { data: availablePlayers, error: playersError } = await supabaseClient
    .from('players')
    .select('*')
    .not('id', 'in', `(${soldPlayerIds.length > 0 ? soldPlayerIds.join(',') : 'null'})`);

  if (playersError) {
    console.error('Error fetching available players:', playersError);
    return {
      action: 'skip',
      reasoning: 'Error fetching available players'
    };
  }

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

  // Get team rosters to analyze composition
  const { data: rosters } = await supabaseClient
    .from('roster')
    .select('team_id, role, is_overseas')
    .eq('room_id', roomId);

  // Filter AI teams that can bid (have budget, slots, and aren't current high bidder)
  const eligibleTeams = aiTeams.filter(team => {
    const hasSlots = (team.slots_left || 11) > 0;
    const hasOverseasSlots = !currentPlayer.is_overseas || 
      (team.overseas_in_squad || 0) < (context.overseasMax || 8);
    const hasBudget = (team.purse_left_cr || 0) > currentHighBid + 5;
    const notCurrentBidder = team.id !== currentHighBidder;
    
    return hasSlots && hasOverseasSlots && hasBudget && notCurrentBidder;
  });

  if (eligibleTeams.length === 0) {
    return {
      action: 'skip',
      reasoning: 'No eligible AI teams can bid'
    };
  }

  // Calculate interest scores for each team
  const teamScores = eligibleTeams.map(team => {
    const teamRoster = rosters?.filter(r => r.team_id === team.id) || [];
    const roleCount = teamRoster.filter(r => r.role === currentPlayer.role).length;
    const budget = team.purse_left_cr || 0;
    const slotsLeft = team.slots_left || 11;
    
    // Role need factor (need players in positions we lack)
    const roleNeedFactor = roleCount < 3 ? 2 : roleCount < 5 ? 1.5 : 1;
    
    // Budget health factor (more willing to bid if we have budget)
    const budgetHealthFactor = budget > 60 ? 2 : budget > 30 ? 1.5 : budget > 15 ? 1 : 0.5;
    
    // Urgency factor (need to fill slots)
    const urgencyFactor = slotsLeft > 10 ? 1.2 : slotsLeft > 5 ? 1 : 0.8;
    
    // Player quality factor (based on base price and marquee status)
    const qualityFactor = currentPlayer.is_marquee ? 2 : 
                         (currentPlayer.base_price_cr || 0.2) > 1 ? 1.5 : 1;
    
    // Price sensitivity (less likely to bid if price is too high relative to budget)
    const priceRatio = currentHighBid / budget;
    const priceSensitivity = priceRatio > 0.4 ? 0.3 : priceRatio > 0.25 ? 0.6 : priceRatio > 0.15 ? 1 : 1.3;
    
    // Overseas preference (slightly prefer domestic to save overseas slots)
    const overseasFactor = currentPlayer.is_overseas ? 0.9 : 1.1;
    
    const interestScore = roleNeedFactor * budgetHealthFactor * urgencyFactor * 
                         qualityFactor * priceSensitivity * overseasFactor;
    
    return { team, interestScore };
  });

  // Sort teams by interest
  teamScores.sort((a, b) => b.interestScore - a.interestScore);
  
  // Top interested teams (top 40% of interested teams will participate)
  const activeTeams = teamScores.filter(ts => ts.interestScore > 0.5);
  
  if (activeTeams.length === 0) {
    return {
      action: 'skip',
      reasoning: 'No teams interested in this player'
    };
  }

  // Higher chance for more interested teams
  const topTeam = activeTeams[0];
  const bidProbability = Math.min(0.85, topTeam.interestScore * 0.4); // Max 85% chance
  
  if (Math.random() > bidProbability) {
    return {
      action: 'skip',
      reasoning: 'AI teams not bidding this round'
    };
  }

  // Select bidding team (weighted towards more interested teams)
  const biddingTeam = Math.random() < 0.7 ? activeTeams[0].team :
                      activeTeams[Math.floor(Math.random() * Math.min(3, activeTeams.length))].team;
  
  // Calculate strategic bid increment based on interest and competition
  let increment = 5; // Base increment
  
  // Aggressive bidding for high-interest players
  if (topTeam.interestScore > 2) {
    increment = Math.random() < 0.4 ? 10 : Math.random() < 0.5 ? 15 : 5;
  } else if (topTeam.interestScore > 1.5) {
    increment = Math.random() < 0.3 ? 10 : 5;
  }
  
  // Occasionally make big jumps for star players (IPL style)
  if (currentPlayer.is_marquee && Math.random() < 0.25 && biddingTeam.purse_left_cr > 40) {
    increment = Math.random() < 0.5 ? 20 : 25;
  }
  
  // Scale increment based on current price (higher prices = bigger increments)
  if (currentHighBid > 30) {
    increment = Math.max(increment, 10);
  } else if (currentHighBid > 50) {
    increment = Math.max(increment, 15);
  }
  
  const bidAmount = currentHighBid + increment;
  
  // Ensure bid doesn't exceed team budget (keep buffer for remaining slots)
  const requiredBuffer = Math.max(5, (biddingTeam.slots_left - 1) * 0.2);
  const maxAffordable = biddingTeam.purse_left_cr - requiredBuffer;
  const finalBidAmount = Math.min(bidAmount, maxAffordable);

  if (finalBidAmount <= currentHighBid) {
    return {
      action: 'skip',
      reasoning: 'Cannot afford to bid higher'
    };
  }

  console.log(`AI team ${biddingTeam.nickname} bidding ${finalBidAmount} cr (interest: ${topTeam.interestScore.toFixed(2)})`);

  return {
    action: 'bid',
    bidAmount: finalBidAmount,
    teamId: biddingTeam.id,
    reasoning: `AI bid ₹${finalBidAmount} Cr for ${currentPlayer.name}`
  };
}