-- Add is_ai column to room_players table to distinguish AI agents from human players
ALTER TABLE public.room_players 
ADD COLUMN is_ai BOOLEAN DEFAULT false;

-- Create index for faster queries on AI agents
CREATE INDEX idx_room_players_is_ai ON public.room_players(is_ai);

-- Update RLS policies to handle AI agents
-- AI agents should be visible to all players in the room
DROP POLICY IF EXISTS "Users can view room players in their rooms" ON public.room_players;

CREATE POLICY "Users can view room players in their rooms"
ON public.room_players
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
  ) OR is_ai = true
);

-- Allow AI agent insertion (for the add_ai_agents function)
CREATE POLICY "System can insert AI agents"
ON public.room_players
FOR INSERT
WITH CHECK (is_ai = true OR auth.uid() = user_id);