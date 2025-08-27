-- Initialize current_auction record for the active room
INSERT INTO public.current_auction (room_id, phase)
SELECT '403f4713-a774-42c4-b267-306aa3a4a6ba', 'idle'
ON CONFLICT (room_id) DO NOTHING;