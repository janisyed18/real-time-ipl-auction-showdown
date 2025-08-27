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
import { AuctionInterface } from '@/components/AuctionInterface';
import { PlayerCard } from '@/components/PlayerCard';
import { AIAgentManager } from '@/components/AIAgentManager';
import { AIAuctionController } from '@/components/AIAuctionController';
import { RosterDisplay } from '@/components/RosterDisplay';
import { StartAuction } from '@/components/StartAuction';
import { NextPlayer } from '@/components/NextPlayer';
import { QuickAddAI } from '@/components/QuickAddAI';

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
    currentAuction,
    availablePlayers,
    roster,
    setRoom,
    setPlayers,
    setTeams,
    setMyTeam,
    setIsHost,
    setCurrentAuction,
    setAvailablePlayers,
    setRoster,
  } = useAuctionStore();

  const [loading, setLoading] = useState(true);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [nickname, setNickname] = useState(searchParams.get('nickname') || '');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;
    
    loadRoomData();
    loadAvailablePlayers();
    setupRealtimeSubscriptions();
    
    // Clean up on unmount
    return () => {
      // Cleanup will be handled by the realtime subscriptions
    };
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

      // Load current auction state
      const { data: auctionData } = await supabase
        .from('current_auction')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle(); // Use maybeSingle to handle case where no record exists

      if (auctionData) {
        setCurrentAuction(auctionData as any);
      } else {
        // No current auction state exists yet
        setCurrentAuction(null);
      }

      // Load roster
      const { data: rosterData } = await supabase
        .from('roster')
        .select('*')
        .eq('room_id', roomId);

      if (rosterData) {
        setRoster(rosterData);
      }

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

  const loadAvailablePlayers = async () => {
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          *,
          stats:stats_t20(*)
        `)
        .order('is_marquee', { ascending: false })
        .order('base_price_cr', { ascending: false });

      if (playersError) throw playersError;
      setAvailablePlayers(playersData as any); // Type assertion for database response
    } catch (error) {
      console.error('Error loading players:', error);
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
            console.log('Updating room state to:', payload.new);
            setRoom(payload.new as any);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'current_auction', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Room: Current auction updated via realtime:', payload);
          if (payload.new) {
            console.log('Room: Setting new current auction state:', payload.new);
            setCurrentAuction(payload.new as any);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'roster', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Roster updated:', payload);
          loadRoomData(); // Refresh room data to get updated roster
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
          {/* AI Auction Controller (invisible component) */}
          <AIAuctionController roomId={roomId!} isActive={room?.status === 'active'} />
          
          {/* Participants */}
          <div className="lg:col-span-1 space-y-4">
            {/* AI Agent Manager (only for host in waiting state) */}
            {room?.status === 'waiting' && (
              <AIAgentManager
                roomId={roomId!}
                players={players}
                isHost={isHost}
                onAgentsAdded={loadRoomData}
              />
            )}
            
            <ParticipantsList 
              players={players}
              myTeam={myTeam}
              isHost={isHost}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Auction Component */}
            <StartAuction 
              roomId={roomId!} 
              isHost={isHost} 
              roomStatus={room?.status || 'waiting'} 
            />

            {/* Quick Add AI Component (for testing) */}
            <QuickAddAI 
              roomId={roomId!}
              isHost={isHost}
              playersCount={players.length}
              onAgentsAdded={loadRoomData}
            />

            {/* Next Player Component (for host when auction is active and idle) */}
            <NextPlayer 
              roomId={roomId!}
              isHost={isHost}
              roomStatus={room?.status || 'waiting'}
              currentAuction={currentAuction}
            />

            {/* Auction Interface */}
            {room?.status === 'active' && (
              <AuctionInterface
                roomId={roomId!}
                myTeam={myTeam}
                players={availablePlayers}
              />
            )}

            {/* Roster Display */}
            <RosterDisplay 
              roster={roster}
              players={availablePlayers}
              teams={teams}
              myTeam={myTeam}
            />

            {/* Room Status */}
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
                  <div className="space-y-4">
                    {/* Available Players for Nomination */}
                    {room?.status === 'active' && currentAuction?.phase === 'idle' && (
                      <div>
                        <h4 className="font-semibold mb-3">Available Players</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {availablePlayers.slice(0, 10).map((player) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              variant="compact"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {room?.status === 'active' && currentAuction?.phase === 'bidding' && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          Use the auction interface above to place your bids
                        </p>
                      </div>
                    )}
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