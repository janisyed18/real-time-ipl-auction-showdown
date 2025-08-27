import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    console.log('AI Agent request received:', { roomId, decision, context });

    if (!roomId || !decision) {
      console.log('Missing required fields:', { roomId, decision });
      throw new Error('Missing required fields');
    }

    console.log('AI Agent making decision:', decision, 'for room:', roomId);

    // Get room and AI teams
    const { data: aiTeams, error: teamsError } = await supabaseClient
      .from('room_players')
      .select('*, team:teams(*)')
      .eq('room_id', roomId)
      .eq('is_ai', true);

    if (teamsError) throw teamsError;

    if (!aiTeams || aiTeams.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No AI teams found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let result = {};

    switch (decision) {
      case 'nominate':
        result = await makeNominationDecision(supabaseClient, openAIApiKey, roomId, aiTeams, context);
        break;
      case 'bid':
        result = await makeBiddingDecision(supabaseClient, openAIApiKey, roomId, aiTeams, context);
        break;
      default:
        throw new Error(`Unknown decision type: ${decision}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai_agent:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function makeNominationDecision(supabaseClient, openAIApiKey, roomId, aiTeams, context) {
  // Get available players
  const { data: availablePlayers } = await supabaseClient
    .from('players')
    .select('*, stats:stats_t20(*)')
    .not('id', 'in', 
      supabaseClient
        .from('roster')
        .select('player_id')
        .eq('room_id', roomId)
    )
    .limit(20);

  // Choose a random AI team to nominate
  const nominatingTeam = aiTeams[Math.floor(Math.random() * aiTeams.length)];

  const prompt = `You are an AI cricket team manager for ${nominatingTeam.team.full_name} in an IPL auction.

Current team status:
- Purse remaining: ₹${nominatingTeam.purse_left_cr} Cr
- Slots remaining: ${nominatingTeam.slots_left}
- Overseas players: ${nominatingTeam.overseas_in_squad}/${context.overseasMax}

Available players (top 20):
${availablePlayers?.map(p => 
  `- ${p.name} (${p.role}, ${p.is_overseas ? 'Overseas' : 'Indian'}, Base: ₹${p.base_price_cr} Cr, Form: ${p.stats?.[0]?.recent_form || 50}%)`
).join('\n') || 'No players available'}

Choose ONE player to nominate and suggest a starting price. Consider:
1. Team balance and missing roles
2. Budget constraints
3. Player value vs base price
4. Strategic importance

Respond in JSON format:
{
  "player_name": "exact name from list",
  "starting_price": 2.5,
  "reasoning": "brief explanation"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  const aiResponse = await response.json();
  console.log('AI Nomination Response:', aiResponse);

  if (!aiResponse.choices?.[0]?.message?.content) {
    throw new Error('Invalid AI response');
  }

  try {
    const decision = JSON.parse(aiResponse.choices[0].message.content);
    const selectedPlayer = availablePlayers?.find(p => p.name === decision.player_name);
    
    if (!selectedPlayer) {
      throw new Error('Player not found in available list');
    }

    return {
      action: 'nominate',
      player_id: selectedPlayer.id,
      team_id: nominatingTeam.team_id,
      starting_price: Math.max(decision.starting_price, selectedPlayer.base_price_cr),
      reasoning: decision.reasoning,
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    // Fallback: nominate first available player
    const fallbackPlayer = availablePlayers?.[0];
    if (fallbackPlayer) {
      return {
        action: 'nominate',
        player_id: fallbackPlayer.id,
        team_id: nominatingTeam.team_id,
        starting_price: fallbackPlayer.base_price_cr,
        reasoning: 'Fallback nomination',
      };
    }
    throw new Error('No players available for nomination');
  }
}

async function makeBiddingDecision(supabaseClient, openAIApiKey, roomId, aiTeams, context) {
  console.log('makeBiddingDecision called with context:', context);
  
  const { currentAuction, currentPlayer } = context;
  
  if (!currentAuction) {
    console.log('No currentAuction in context');
    return { action: 'skip', reasoning: 'No current auction data' };
  }
  
  if (!currentPlayer) {
    console.log('No currentPlayer in context');
    return { action: 'skip', reasoning: 'No current player data' };
  }
  
  console.log('Current auction data:', currentAuction);
  console.log('Current player data:', currentPlayer);

  // Get current high bidder
  const highBidderTeam = aiTeams.find(t => t.team_id === currentAuction.high_team_id);
  
  // Filter AI teams that can bid (not current high bidder, have budget, etc.)
  const eligibleTeams = aiTeams.filter(team => {
    const minIncrement = currentAuction.high_bid_cr < 5 ? 0.2 : 0.5;
    const nextBidAmount = currentAuction.high_bid_cr + minIncrement;
    const remainingSlots = team.slots_left - 1;
    const minBudgetForSlots = remainingSlots * 0.2;
    
    return (
      team.team_id !== currentAuction.high_team_id && // Not current high bidder
      team.purse_left_cr >= nextBidAmount + minBudgetForSlots && // Has budget
      (!currentPlayer.is_overseas || team.overseas_in_squad < context.overseasMax) // Overseas limit check
    );
  });

  if (eligibleTeams.length === 0) {
    return { action: 'skip', reasoning: 'No eligible AI teams to bid' };
  }

  // Choose a random eligible team to potentially bid
  const biddingTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];

  const prompt = `You are an AI cricket team manager for ${biddingTeam.team.full_name} in an IPL auction.

Current auction:
- Player: ${currentPlayer.name} (${currentPlayer.role}, ${currentPlayer.is_overseas ? 'Overseas' : 'Indian'})
- Current bid: ₹${currentAuction.high_bid_cr} Cr
- Base price: ₹${currentAuction.base_cr} Cr
- Player stats: Form ${context.playerStats?.recent_form || 50}%, Avg ${context.playerStats?.batting_avg || 'N/A'}

Your team status:
- Purse remaining: ₹${biddingTeam.purse_left_cr} Cr
- Slots remaining: ${biddingTeam.slots_left}
- Overseas players: ${biddingTeam.overseas_in_squad}/${context.overseasMax}

Bidding rules:
- Minimum increment: ₹${currentAuction.high_bid_cr < 5 ? 0.2 : 0.5} Cr
- Must reserve ₹0.2 Cr per remaining slot

Decision: Should you bid? If yes, what amount?

Consider:
1. Player value vs current price
2. Team needs for this role
3. Budget management
4. Competition intensity

Respond in JSON format:
{
  "should_bid": true/false,
  "bid_amount": 3.5,
  "reasoning": "brief explanation"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  const aiResponse = await response.json();
  console.log('AI Bidding Response:', aiResponse);

  if (!aiResponse.choices?.[0]?.message?.content) {
    return { action: 'skip', reasoning: 'AI response error' };
  }

  try {
    const decision = JSON.parse(aiResponse.choices[0].message.content);
    
    if (!decision.should_bid) {
      return { action: 'skip', reasoning: decision.reasoning };
    }

    const minIncrement = currentAuction.high_bid_cr < 5 ? 0.2 : 0.5;
    const minBidAmount = currentAuction.high_bid_cr + minIncrement;
    const maxBudget = biddingTeam.purse_left_cr - ((biddingTeam.slots_left - 1) * 0.2);
    
    const bidAmount = Math.min(
      Math.max(decision.bid_amount, minBidAmount),
      maxBudget
    );

    if (bidAmount < minBidAmount) {
      return { action: 'skip', reasoning: 'Insufficient budget for minimum bid' };
    }

    return {
      action: 'bid',
      team_id: biddingTeam.team_id,
      bid_amount: bidAmount,
      reasoning: decision.reasoning,
    };
  } catch (parseError) {
    console.error('Failed to parse AI bidding response:', parseError);
    return { action: 'skip', reasoning: 'AI decision parsing error' };
  }
}