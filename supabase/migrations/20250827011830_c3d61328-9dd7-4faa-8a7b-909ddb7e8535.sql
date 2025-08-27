-- Fix infinite recursion in room_players RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view room players in their rooms" ON public.room_players;

-- Create a security definer function to get user's room IDs safely
CREATE OR REPLACE FUNCTION public.get_user_room_ids(_user_id UUID)
RETURNS TABLE(room_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rp.room_id 
  FROM room_players rp 
  WHERE rp.user_id = _user_id;
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view room players in their rooms" 
ON public.room_players 
FOR SELECT 
USING (
  (room_id IN (SELECT public.get_user_room_ids(auth.uid()))) 
  OR (is_ai = true)
);