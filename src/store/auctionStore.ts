import { create } from 'zustand';
import { AuctionState, AuctionRoom, RoomPlayer, CurrentAuction, Bid, RosterEntry, Player, Team } from '@/types/auction';

interface AuctionStore extends AuctionState {
  setRoom: (room: AuctionRoom | null) => void;
  setPlayers: (players: RoomPlayer[]) => void;
  setCurrentAuction: (auction: CurrentAuction | null) => void;
  setBids: (bids: Bid[]) => void;
  setRoster: (roster: RosterEntry[]) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  setMyTeam: (team: Team | null) => void;
  setIsHost: (isHost: boolean) => void;
  addBid: (bid: Bid) => void;
  addRosterEntry: (entry: RosterEntry) => void;
  updatePlayer: (player: RoomPlayer) => void;
  reset: () => void;
}

const initialState: AuctionState = {
  room: null,
  players: [],
  currentAuction: null,
  bids: [],
  roster: [],
  availablePlayers: [],
  teams: [],
  myTeam: null,
  isHost: false,
};

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  ...initialState,
  
  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setCurrentAuction: (currentAuction) => set({ currentAuction }),
  setBids: (bids) => set({ bids }),
  setRoster: (roster) => set({ roster }),
  setAvailablePlayers: (availablePlayers) => set({ availablePlayers }),
  setTeams: (teams) => set({ teams }),
  setMyTeam: (myTeam) => set({ myTeam }),
  setIsHost: (isHost) => set({ isHost }),
  
  addBid: (bid) => set((state) => ({ bids: [...state.bids, bid] })),
  addRosterEntry: (entry) => set((state) => ({ roster: [...state.roster, entry] })),
  updatePlayer: (updatedPlayer) => set((state) => ({
    players: state.players.map((player) => 
      player.id === updatedPlayer.id ? updatedPlayer : player
    )
  })),
  
  reset: () => set(initialState),
}));