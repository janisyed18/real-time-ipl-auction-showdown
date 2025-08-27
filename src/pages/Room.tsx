import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuctionStore } from '@/store/auctionStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Users, Crown, DollarSign, Timer, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamSelection } from '@/components/TeamSelection';
import { RoomHeader } from '@/components/RoomHeader';
import { ParticipantsList } from '@/components/ParticipantsList';

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    room,
    players,
    teams,
    myTeam,
    isHost,
    setRoom,
    setPlayers,
    setTeams,
    setMyTeam,
    setIsHost,
  } = useAuctionStore();

  const [loading, setLoading] = useState(true);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [nickname, setNickname] = useState(searchParams.get('nickname') || '');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;
    
    loadRoomData();
    setupRealtimeSubscriptions();
  }, [roomId, user]);

  const loadRoomData = async () => {
    try {
      // Load room details
      const { data: roomData, error: roomError } = await supabase
        .from('auction_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData as any); // Type assertion for database response
      setIsHost(roomData.host_user_id === user?.id);

      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('short_name');

      if (teamsError) throw teamsError;
      setTeams(teamsData);

      // Load room participants
      const { data: playersData, error: playersError } = await supabase
        .from('room_players')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('room_id', roomId);

      if (playersError) throw playersError;
      setPlayers(playersData);

      // Check if current user is already in the room
      const myPlayer = playersData.find(p => p.user_id === user?.id);
      if (myPlayer) {
        setMyTeam(myPlayer.team);
      } else if (nickname) {
        // User needs to join the room
        setShowTeamSelection(true);
      }

    } catch (error: any) {
      console.error('Error loading room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load room data",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const roomChannel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Room players updated:', payload);
          loadRoomData(); // Refresh room data
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auction_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          console.log('Room updated:', payload);
          if (payload.new) {
            setRoom(payload.new as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  };

  const handleTeamSelection = async (teamId: string) => {
    if (!user || !roomId || !nickname) return;

    setJoining(true);
    try {
      const selectedTeam = teams.find(t => t.id === teamId);
      if (!selectedTeam) throw new Error('Team not found');

      // Check if team is already taken
      const isTeamTaken = players.some(p => p.team_id === teamId);
      if (isTeamTaken) {
        throw new Error('This team is already taken');
      }

      // Join the room
      const { error } = await supabase
        .from('room_players')
        .insert({
          room_id: roomId,
          user_id: user.id,
          nickname,
          team_id: teamId,
          purse_left_cr: room?.purse_cr || 120,
          slots_left: room?.squad_max || 25,
        });

      if (error) throw error;

      setMyTeam(selectedTeam);
      setShowTeamSelection(false);
      
      toast({
        title: "Joined Successfully!",
        description: `You've joined as ${selectedTeam.full_name}`,
      });

    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const startAuction = async () => {
    if (!isHost || !roomId) return;

    try {
      const { error } = await supabase
        .from('auction_rooms')
        .update({ status: 'active' })
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Auction Started!",
        description: "The auction has begun. Good luck!",
      });

    } catch (error: any) {
      console.error('Error starting auction:', error);
      toast({
        title: "Error",
        description: "Failed to start auction",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (showTeamSelection) {
    return (
      <TeamSelection
        teams={teams}
        takenTeams={players.map(p => p.team_id)}
        onSelect={handleTeamSelection}
        loading={joining}
        nickname={nickname}
        onBack={() => navigate('/')}
      />
    );
  }

  const canStartAuction = isHost && players.length >= 2 && room?.status === 'waiting';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {room && (
          <RoomHeader 
            room={room}
            isHost={isHost}
            participantCount={players.length}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Participants */}
          <div className="lg:col-span-1">
            <ParticipantsList 
              players={players}
              myTeam={myTeam}
              isHost={isHost}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <CricketCard variant="auction">
              <CricketCardHeader>
                <div className="flex items-center justify-between">
                  <CricketCardTitle className="text-xl">
                    {room?.status === 'waiting' ? 'Waiting for Players' : 'Auction in Progress'}
                  </CricketCardTitle>
                  {room?.status === 'waiting' && (
                    <Badge variant="secondary">
                      {players.length} / 10 players
                    </Badge>
                  )}
                </div>
              </CricketCardHeader>
              <CricketCardContent>
                {room?.status === 'waiting' ? (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {players.length < 2 ? 'Waiting for more players...' : 'Ready to start!'}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {players.length < 2 
                          ? 'Need at least 2 players to start the auction'
                          : 'All set! The host can start the auction when ready.'
                        }
                      </p>
                      
                      {canStartAuction && (
                        <Button 
                          onClick={startAuction}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-accent"
                        >
                          <Trophy className="mr-2 h-5 w-5" />
                          Start Auction
                        </Button>
                      )}
                    </div>

                    {/* Room Settings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                      <div className="text-center">
                        <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Purse</p>
                        <p className="font-semibold">₹{room?.purse_cr} Cr</p>
                      </div>
                      <div className="text-center">
                        <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Squad Size</p>
                        <p className="font-semibold">{room?.squad_min}-{room?.squad_max}</p>
                      </div>
                      <div className="text-center">
                        <Crown className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Overseas</p>
                        <p className="font-semibold">Max {room?.overseas_max}</p>
                      </div>
                      <div className="text-center">
                        <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Bid Timer</p>
                        <p className="font-semibold">{room?.bid_turn_seconds}s</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Auction Active</h3>
                    <p className="text-muted-foreground">
                      The auction is currently in progress...
                    </p>
                  </div>
                )}
              </CricketCardContent>
            </CricketCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;