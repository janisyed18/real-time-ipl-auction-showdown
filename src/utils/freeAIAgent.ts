import { pipeline } from '@huggingface/transformers';

// Initialize the text generation pipeline (this will download the model on first use)
let textGenerator: any = null;

const initializeModel = async () => {
  if (!textGenerator) {
    console.log('Loading free AI model...');
    textGenerator = await pipeline(
      'text-generation',
      'onnx-community/Phi-3.5-mini-instruct',
      { device: 'webgpu' } // Use WebGPU for better performance, falls back to CPU
    );
    console.log('Free AI model loaded successfully');
  }
  return textGenerator;
};

export interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  base_price: number;
  is_overseas: boolean;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  slots_filled: number;
  overseas_slots_filled: number;
  max_slots: number;
  max_overseas_slots: number;
}

export const makeNominationDecision = async (
  teams: Team[],
  availablePlayers: Player[]
): Promise<{
  action: 'nominate';
  playerId: string;
  teamId: string;
  startingPrice: number;
  reasoning: string;
}> => {
  try {
    const generator = await initializeModel();
    
    // Find a team that can nominate
    const eligibleTeams = teams.filter(team => 
      team.budget > 0 && team.slots_filled < team.max_slots
    );
    
    if (eligibleTeams.length === 0 || availablePlayers.length === 0) {
      throw new Error('No eligible teams or players available');
    }

    // Select random team and player for nomination
    const selectedTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
    const selectedPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    
    const prompt = `You are a cricket auction strategist. Given this player:
    
Player: ${selectedPlayer.name}
Role: ${selectedPlayer.role}
Country: ${selectedPlayer.country}
Base Price: ${selectedPlayer.base_price} cr
Is Overseas: ${selectedPlayer.is_overseas}

Team Budget: ${selectedTeam.budget} cr
Team Slots: ${selectedTeam.slots_filled}/${selectedTeam.max_slots}
Overseas Slots: ${selectedTeam.overseas_slots_filled}/${selectedTeam.max_overseas_slots}

Suggest a starting bid (between base price and 150% of base price). Respond ONLY with a number between ${selectedPlayer.base_price} and ${Math.round(selectedPlayer.base_price * 1.5)}.`;

    const result = await generator(prompt, {
      max_new_tokens: 10,
      temperature: 0.7,
      do_sample: true,
    });

    // Extract the starting price from the response
    const responseText = result[0].generated_text.slice(prompt.length).trim();
    const startingPrice = Math.max(
      selectedPlayer.base_price,
      Math.min(
        Math.round(selectedPlayer.base_price * 1.5),
        parseInt(responseText.match(/\d+/)?.[0] || selectedPlayer.base_price.toString())
      )
    );

    return {
      action: 'nominate',
      playerId: selectedPlayer.id,
      teamId: selectedTeam.id,
      startingPrice,
      reasoning: `AI nominated ${selectedPlayer.name} for ${startingPrice} cr`
    };
  } catch (error) {
    console.error('Error in AI nomination:', error);
    
    // Fallback logic
    const eligibleTeams = teams.filter(team => 
      team.budget > 0 && team.slots_filled < team.max_slots
    );
    
    if (eligibleTeams.length === 0 || availablePlayers.length === 0) {
      throw new Error('No eligible teams or players available');
    }

    const selectedTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
    const selectedPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    
    return {
      action: 'nominate',
      playerId: selectedPlayer.id,
      teamId: selectedTeam.id,
      startingPrice: selectedPlayer.base_price,
      reasoning: `Fallback nomination: ${selectedPlayer.name} for ${selectedPlayer.base_price} cr`
    };
  }
};

export const makeBiddingDecision = async (
  currentAuction: any,
  eligibleTeams: Team[]
): Promise<{
  action: 'bid' | 'skip';
  bidAmount?: number;
  teamId?: string;
  reasoning: string;
}> => {
  try {
    if (eligibleTeams.length === 0) {
      return {
        action: 'skip',
        reasoning: 'No eligible teams available to bid'
      };
    }

    const generator = await initializeModel();
    const selectedTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
    const currentBid = currentAuction.high_bid_cr || currentAuction.base_cr;
    const minimumBid = currentBid + 5; // 5 cr increment

    if (minimumBid > selectedTeam.budget) {
      return {
        action: 'skip',
        reasoning: `Team ${selectedTeam.name} cannot afford minimum bid of ${minimumBid} cr`
      };
    }

    const prompt = `You are bidding in a cricket auction. Current situation:
    
Current bid: ${currentBid} cr
Minimum next bid: ${minimumBid} cr
Team budget: ${selectedTeam.budget} cr
Team slots: ${selectedTeam.slots_filled}/${selectedTeam.max_slots}

Should you bid? Respond with only "YES" or "NO".`;

    const result = await generator(prompt, {
      max_new_tokens: 5,
      temperature: 0.8,
      do_sample: true,
    });

    const responseText = result[0].generated_text.slice(prompt.length).trim().toUpperCase();
    const shouldBid = responseText.includes('YES');

    if (shouldBid && Math.random() > 0.3) { // 70% chance to bid if AI says yes
      const maxBid = Math.min(selectedTeam.budget, currentBid + 20); // Don't bid too aggressively
      const bidAmount = Math.min(maxBid, minimumBid + Math.floor(Math.random() * 10));
      
      return {
        action: 'bid',
        bidAmount,
        teamId: selectedTeam.id,
        reasoning: `AI decided to bid ${bidAmount} cr for team ${selectedTeam.name}`
      };
    }

    return {
      action: 'skip',
      reasoning: `AI decided not to bid (current: ${currentBid} cr)`
    };
  } catch (error) {
    console.error('Error in AI bidding decision:', error);
    
    // Random fallback decision
    if (Math.random() > 0.5 && eligibleTeams.length > 0) {
      const selectedTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
      const currentBid = currentAuction.high_bid_cr || currentAuction.base_cr;
      const minimumBid = currentBid + 5;
      
      if (minimumBid <= selectedTeam.budget) {
        return {
          action: 'bid',
          bidAmount: minimumBid,
          teamId: selectedTeam.id,
          reasoning: `Fallback bid: ${minimumBid} cr`
        };
      }
    }

    return {
      action: 'skip',
      reasoning: 'Fallback decision: skip bidding'
    };
  }
};