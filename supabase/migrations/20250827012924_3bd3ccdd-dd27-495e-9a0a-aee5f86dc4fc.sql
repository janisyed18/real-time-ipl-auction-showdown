-- Update all player base prices to be maximum 2cr
UPDATE public.players 
SET base_price_cr = 2.0 
WHERE base_price_cr > 2.0;