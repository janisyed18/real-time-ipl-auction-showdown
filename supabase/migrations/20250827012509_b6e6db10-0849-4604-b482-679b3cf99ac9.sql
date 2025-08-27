-- Create current_auction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.current_auction (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.auction_rooms(id) ON DELETE CASCADE,
    phase TEXT NOT NULL DEFAULT 'idle' CHECK (phase IN ('idle', 'nomination', 'bidding', 'sold', 'unsold')),
    current_player_id UUID REFERENCES public.players(id),
    base_cr DECIMAL(5,2) DEFAULT 0,
    high_bid_cr DECIMAL(5,2) DEFAULT 0,
    high_team_id UUID REFERENCES public.teams(id),
    nominated_by UUID REFERENCES public.teams(id),
    turn_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(room_id)
);

-- Enable Row Level Security
ALTER TABLE public.current_auction ENABLE ROW LEVEL SECURITY;

-- Create policies for current_auction
CREATE POLICY "Current auction is viewable by all authenticated users" 
ON public.current_auction 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Current auction can be updated by authenticated users" 
ON public.current_auction 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Current auction can be inserted by authenticated users" 
ON public.current_auction 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_current_auction_updated_at
BEFORE UPDATE ON public.current_auction
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize current_auction record for the active room
INSERT INTO public.current_auction (room_id, phase)
SELECT id, 'idle' 
FROM public.auction_rooms 
WHERE status = 'active'
ON CONFLICT (room_id) DO NOTHING;