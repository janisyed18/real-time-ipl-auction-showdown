-- Insert sample IPL players for testing
INSERT INTO public.players (name, role, is_overseas, base_price_cr, is_marquee, country) VALUES
-- Marquee Players (Star Players)
('Virat Kohli', 'Batter', false, 15.0, true, 'India'),
('MS Dhoni', 'WK', false, 12.0, true, 'India'),
('Rohit Sharma', 'Batter', false, 16.0, true, 'India'),
('KL Rahul', 'WK', false, 11.0, true, 'India'),
('Rishabh Pant', 'WK', false, 16.0, true, 'India'),
('Jasprit Bumrah', 'Pacer', false, 12.0, true, 'India'),
('Jos Buttler', 'WK', true, 10.0, true, 'England'),
('Ben Stokes', 'All-rounder', true, 12.5, true, 'England'),
('David Warner', 'Batter', true, 10.5, true, 'Australia'),
('Pat Cummins', 'Pacer', true, 15.5, true, 'Australia'),

-- Premium Indian Players
('Hardik Pandya', 'All-rounder', false, 15.0, false, 'India'),
('Ravindra Jadeja', 'All-rounder', false, 12.0, false, 'India'),
('Shubman Gill', 'Batter', false, 9.0, false, 'India'),
('Ishan Kishan', 'WK', false, 15.25, false, 'India'),
('Shreyas Iyer', 'Batter', false, 12.25, false, 'India'),
('Mohammed Shami', 'Pacer', false, 10.0, false, 'India'),
('Yuzvendra Chahal', 'Spinner', false, 6.5, false, 'India'),
('Kuldeep Yadav', 'Spinner', false, 5.25, false, 'India'),
('Mohammed Siraj', 'Pacer', false, 4.2, false, 'India'),
('Arshdeep Singh', 'Pacer', false, 4.0, false, 'India'),

-- Premium Overseas Players
('Kagiso Rabada', 'Pacer', true, 9.25, false, 'South Africa'),
('Trent Boult', 'Pacer', true, 8.0, false, 'New Zealand'),
('Mitchell Starc', 'Pacer', true, 11.5, false, 'Australia'),
('Rashid Khan', 'Spinner', true, 15.0, false, 'Afghanistan'),
('Andre Russell', 'All-rounder', true, 12.0, false, 'West Indies'),
('Glenn Maxwell', 'All-rounder', true, 11.0, false, 'Australia'),
('Marcus Stoinis', 'All-rounder', true, 6.0, false, 'Australia'),
('Moeen Ali', 'All-rounder', true, 7.0, false, 'England'),
('Jonny Bairstow', 'WK', true, 6.75, false, 'England'),
('Liam Livingstone', 'All-rounder', true, 8.5, false, 'England'),

-- Good Indian Players
('Prithvi Shaw', 'Batter', false, 7.5, false, 'India'),
('Devdutt Padikkal', 'Batter', false, 6.0, false, 'India'),
('Ruturaj Gaikwad', 'Batter', false, 7.0, false, 'India'),
('Sanju Samson', 'WK', false, 14.0, false, 'India'),
('Dinesh Karthik', 'WK', false, 5.5, false, 'India'),
('Washington Sundar', 'All-rounder', false, 8.75, false, 'India'),
('Axar Patel', 'All-rounder', false, 9.0, false, 'India'),
('Deepak Chahar', 'Pacer', false, 14.0, false, 'India'),
('Bhuvneshwar Kumar', 'Pacer', false, 4.2, false, 'India'),
('T Natarajan', 'Pacer', false, 4.0, false, 'India'),

-- Overseas Talents
('Heinrich Klaasen', 'WK', true, 5.25, false, 'South Africa'),
('Jason Roy', 'Batter', true, 2.0, false, 'England'),
('Alex Hales', 'Batter', true, 1.5, false, 'England'),
('Faf du Plessis', 'Batter', true, 7.0, false, 'South Africa'),
('Kane Williamson', 'Batter', true, 2.0, false, 'New Zealand'),
('Dwayne Bravo', 'All-rounder', true, 4.2, false, 'West Indies'),
('Kieron Pollard', 'All-rounder', true, 2.0, false, 'West Indies'),
('Sunil Narine', 'All-rounder', true, 6.0, false, 'West Indies'),
('Adam Zampa', 'Spinner', true, 2.4, false, 'Australia'),
('Wanindu Hasaranga', 'All-rounder', true, 10.75, false, 'Sri Lanka'),

-- Budget Players
('Mayank Agarwal', 'Batter', false, 1.0, false, 'India'),
('Robin Uthappa', 'Batter', false, 2.0, false, 'India'),
('Manish Pandey', 'Batter', false, 4.6, false, 'India'),
('Kedar Jadhav', 'All-rounder', false, 0.75, false, 'India'),
('Krunal Pandya', 'All-rounder', false, 8.25, false, 'India'),
('Ravichandran Ashwin', 'Spinner', false, 5.0, false, 'India'),
('Shardul Thakur', 'All-rounder', false, 10.75, false, 'India'),
('Umesh Yadav', 'Pacer', false, 2.0, false, 'India'),
('Khaleel Ahmed', 'Pacer', false, 5.25, false, 'India'),
('Jaydev Unadkat', 'Pacer', false, 1.3, false, 'India');

-- Insert some basic stats for these players
INSERT INTO public.stats_t20 (player_id, batting_sr, batting_avg, boundary_pct, bowling_econ, bowling_sr, recent_form, matches_played)
SELECT 
  p.id,
  CASE 
    WHEN p.role IN ('Batter', 'WK') THEN 120 + random() * 60
    WHEN p.role = 'All-rounder' THEN 130 + random() * 50
    ELSE 100 + random() * 40
  END as batting_sr,
  CASE 
    WHEN p.role IN ('Batter', 'WK') THEN 25 + random() * 25
    WHEN p.role = 'All-rounder' THEN 20 + random() * 20
    ELSE 10 + random() * 15
  END as batting_avg,
  CASE 
    WHEN p.role IN ('Batter', 'WK') THEN 40 + random() * 30
    ELSE 20 + random() * 20
  END as boundary_pct,
  CASE 
    WHEN p.role IN ('Pacer', 'Spinner', 'All-rounder') THEN 6 + random() * 4
    ELSE 8 + random() * 3
  END as bowling_econ,
  CASE 
    WHEN p.role IN ('Pacer', 'Spinner', 'All-rounder') THEN 15 + random() * 10
    ELSE 25 + random() * 10
  END as bowling_sr,
  50 + random() * 40 as recent_form,
  50 + floor(random() * 100) as matches_played
FROM public.players p;