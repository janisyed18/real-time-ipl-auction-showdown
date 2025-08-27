export interface Team {
  id: string;
  short_name: string;
  full_name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface Player {
  id: string;
  name: string;
  role: 'Batter' | 'All-rounder' | 'WK' | 'Pacer' | 'Spinner';
  is_overseas: boolean;
  image_url?: string;
  base_price_cr: number;
  is_marquee: boolean;
  country?: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  batting_sr: number;
  batting_avg: number;
  boundary_pct: number;
  bowling_econ: number;
  bowling_sr: number;
  pp_sr: number;
  death_econ: number;
  recent_form: number;
  matches_played: number;
}

export interface AuctionRoom {
  id: string;
  code: string;
  host_user_id: string;
  purse_cr: number;
  squad_min: number;
  squad_max: number;
  overseas_max: number;
  nomination_seconds: number;
  bid_turn_seconds: number;
  rtm_enabled: boolean;
  accelerated_rounds: boolean;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  team_id: string;
  team?: Team;
  purse_left_cr: number;
  slots_left: number;
  overseas_in_squad: number;
  created_at: string;
}

export interface Bid {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  amount_cr: number;
  created_at: string;
}

export interface RosterEntry {
  id: string;
  room_id: string;
  team_id: string;
  player_id: string;
  role: string;
  is_overseas: boolean;
  price_cr: number;
  created_at: string;
}

export interface CurrentAuction {
  room_id: string;
  phase: 'idle' | 'nominating' | 'bidding' | 'finalizing';
  current_player_id?: string;
  current_player?: Player;
  base_cr?: number;
  high_bid_cr?: number;
  high_team_id?: string;
  high_team?: Team;
  turn_ends_at?: string;
  nominated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuctionState {
  room: AuctionRoom | null;
  players: RoomPlayer[];
  currentAuction: CurrentAuction | null;
  bids: Bid[];
  roster: RosterEntry[];
  availablePlayers: Player[];
  teams: Team[];
  myTeam: Team | null;
  isHost: boolean;
}