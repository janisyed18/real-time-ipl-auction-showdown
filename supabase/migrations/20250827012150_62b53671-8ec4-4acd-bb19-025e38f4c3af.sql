-- Enable real-time for auction tables
ALTER TABLE public.auction_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.current_auction REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_auction;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;