-- Create teams table with IPL team information
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_name TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auction_rooms table for room management
CREATE TABLE public.auction_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_user_id UUID NOT NULL,
  purse_cr NUMERIC DEFAULT 120.0,
  squad_min INTEGER DEFAULT 18,
  squad_max INTEGER DEFAULT 25,
  overseas_max INTEGER DEFAULT 8,
  nomination_seconds INTEGER DEFAULT 60,
  bid_turn_seconds INTEGER DEFAULT 12,
  rtm_enabled BOOLEAN DEFAULT false,
  accelerated_rounds BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_players table for players in each room
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.auction_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id),
  purse_left_cr NUMERIC NOT NULL,
  slots_left INTEGER NOT NULL,
  overseas_in_squad INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, team_id)
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Batter', 'All-rounder', 'WK', 'Pacer', 'Spinner')),
  is_overseas BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  base_price_cr NUMERIC NOT NULL DEFAULT 0.2,
  is_marquee BOOLEAN DEFAULT false,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bids table for bid history
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.auction_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  amount_cr NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roster table for purchased players
CREATE TABLE public.roster (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.auction_rooms(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id),
  player_id UUID NOT NULL REFERENCES public.players(id),
  role TEXT NOT NULL,
  is_overseas BOOLEAN NOT NULL,
  price_cr NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, player_id)
);

-- Create current_auction table for tracking current auction state
CREATE TABLE public.current_auction (
  room_id UUID NOT NULL PRIMARY KEY REFERENCES public.auction_rooms(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'idle' CHECK (phase IN ('idle', 'nominating', 'bidding', 'finalizing')),
  current_player_id UUID REFERENCES public.players(id),
  base_cr NUMERIC,
  high_bid_cr NUMERIC,
  high_team_id UUID REFERENCES public.teams(id),
  turn_ends_at TIMESTAMP WITH TIME ZONE,
  nominated_by UUID REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stats_t20 table for player statistics
CREATE TABLE public.stats_t20 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) UNIQUE,
  batting_sr NUMERIC DEFAULT 0,
  batting_avg NUMERIC DEFAULT 0,
  boundary_pct NUMERIC DEFAULT 0,
  bowling_econ NUMERIC DEFAULT 0,
  bowling_sr NUMERIC DEFAULT 0,
  pp_sr NUMERIC DEFAULT 0,
  death_econ NUMERIC DEFAULT 0,
  recent_form NUMERIC DEFAULT 50,
  matches_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_auction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_t20 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams (public read)
CREATE POLICY "Teams are viewable by everyone"
ON public.teams
FOR SELECT
USING (true);

-- Create RLS policies for auction_rooms
CREATE POLICY "Anyone can view auction rooms"
ON public.auction_rooms
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create auction rooms"
ON public.auction_rooms
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Host can update their rooms"
ON public.auction_rooms
FOR UPDATE
USING (auth.uid() = host_user_id);

-- Create RLS policies for room_players
CREATE POLICY "Users can view room players in their rooms"
ON public.room_players
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join rooms"
ON public.room_players
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own room player data"
ON public.room_players
FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for players (public read)
CREATE POLICY "Players are viewable by everyone"
ON public.players
FOR SELECT
USING (true);

-- Create RLS policies for bids
CREATE POLICY "Users can view bids in their rooms"
ON public.bids
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can place bids in their rooms"
ON public.bids
FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for roster
CREATE POLICY "Users can view roster in their rooms"
ON public.roster
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert roster entries"
ON public.roster
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for current_auction
CREATE POLICY "Users can view current auction in their rooms"
ON public.current_auction
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage current auction"
ON public.current_auction
FOR ALL
USING (true);

-- Create RLS policies for stats_t20 (public read)
CREATE POLICY "Stats are viewable by everyone"
ON public.stats_t20
FOR SELECT
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_auction_rooms_updated_at
  BEFORE UPDATE ON public.auction_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_current_auction_updated_at
  BEFORE UPDATE ON public.current_auction
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stats_t20_updated_at
  BEFORE UPDATE ON public.stats_t20
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert IPL teams
INSERT INTO public.teams (short_name, full_name, logo_url, primary_color, secondary_color) VALUES
('CSK', 'Chennai Super Kings', 'https://images.iplt20.com/teams/logos/CSK.png', '#FFFF00', '#FF6F00'),
('MI', 'Mumbai Indians', 'https://images.iplt20.com/teams/logos/MI.png', '#004BA0', '#FF6F00'),
('RCB', 'Royal Challengers Bangalore', 'https://images.iplt20.com/teams/logos/RCB.png', '#FF0000', '#FFD700'),
('KKR', 'Kolkata Knight Riders', 'https://images.iplt20.com/teams/logos/KKR.png', '#3F2267', '#B39CD0'),
('DC', 'Delhi Capitals', 'https://images.iplt20.com/teams/logos/DC.png', '#282968', '#FF6F00'),
('PBKS', 'Punjab Kings', 'https://images.iplt20.com/teams/logos/PBKS.png', '#FF0000', '#C0C0C0'),
('RR', 'Rajasthan Royals', 'https://images.iplt20.com/teams/logos/RR.png', '#FF1493', '#FFD700'),
('SRH', 'Sunrisers Hyderabad', 'https://images.iplt20.com/teams/logos/SRH.png', '#FF8C00', '#000000'),
('GT', 'Gujarat Titans', 'https://images.iplt20.com/teams/logos/GT.png', '#1B2951', '#FFD700'),
('LSG', 'Lucknow Super Giants', 'https://images.iplt20.com/teams/logos/LSG.png', '#00BFFF', '#FF6F00');

-- Create indexes for better performance
CREATE INDEX idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX idx_room_players_user_id ON public.room_players(user_id);
CREATE INDEX idx_bids_room_id ON public.bids(room_id);
CREATE INDEX idx_bids_player_id ON public.bids(player_id);
CREATE INDEX idx_roster_room_id ON public.roster(room_id);
CREATE INDEX idx_roster_team_id ON public.roster(team_id);
CREATE INDEX idx_current_auction_room_id ON public.current_auction(room_id);
CREATE INDEX idx_stats_t20_player_id ON public.stats_t20(player_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roster;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_auction;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_rooms;