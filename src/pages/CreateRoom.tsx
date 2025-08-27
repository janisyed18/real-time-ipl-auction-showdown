import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { ArrowLeft, Users, DollarSign, Timer, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: '',
    purse: 120.0,
    squadMin: 18,
    squadMax: 25,
    overseasMax: 8,
    nominationSeconds: 60,
    bidTurnSeconds: 12,
    rtmEnabled: false,
    acceleratedRounds: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.nickname.trim()) {
      toast({
        title: "Nickname Required",
        description: "Please enter your nickname.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate 6-digit room code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('Creating room with:', { code, userId: user.id, ...formData });
      
      // Create auction room
      const { data: room, error: roomError } = await supabase
        .from('auction_rooms')
        .insert({
          code,
          host_user_id: user.id,
          purse_cr: formData.purse,
          squad_min: formData.squadMin,
          squad_max: formData.squadMax,
          overseas_max: formData.overseasMax,
          nomination_seconds: formData.nominationSeconds,
          bid_turn_seconds: formData.bidTurnSeconds,
          rtm_enabled: formData.rtmEnabled,
          accelerated_rounds: formData.acceleratedRounds,
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw roomError;
      }

      console.log('Room created successfully:', room);

      toast({
        title: "Room Created!",
        description: `Room code: ${code}`,
      });

      // Navigate to room with nickname parameter
      navigate(`/room/${room.id}?nickname=${encodeURIComponent(formData.nickname)}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state while authenticating
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <CricketCard variant="auction" className="mb-8">
          <CricketCardHeader>
            <CricketCardTitle className="text-2xl text-center">Create Auction Room</CricketCardTitle>
          </CricketCardHeader>
          <CricketCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Settings</h3>
                </div>
                
                <div>
                  <Label htmlFor="nickname">Your Nickname</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Enter your nickname"
                    required
                  />
                </div>
              </div>

              {/* Financial Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Financial Settings</h3>
                </div>
                
                <div>
                  <Label htmlFor="purse">Team Purse (₹ Crores)</Label>
                  <Input
                    id="purse"
                    type="number"
                    min="50"
                    max="200"
                    step="0.1"
                    value={formData.purse}
                    onChange={(e) => setFormData({ ...formData, purse: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              {/* Squad Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Squad Rules</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="squadMin">Min Squad Size</Label>
                    <Input
                      id="squadMin"
                      type="number"
                      min="15"
                      max="25"
                      value={formData.squadMin}
                      onChange={(e) => setFormData({ ...formData, squadMin: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="squadMax">Max Squad Size</Label>
                    <Input
                      id="squadMax"
                      type="number"
                      min="18"
                      max="30"
                      value={formData.squadMax}
                      onChange={(e) => setFormData({ ...formData, squadMax: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="overseasMax">Max Overseas Players</Label>
                  <Input
                    id="overseasMax"
                    type="number"
                    min="4"
                    max="10"
                    value={formData.overseasMax}
                    onChange={(e) => setFormData({ ...formData, overseasMax: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Timer Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Timer className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Timer Settings</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominationSeconds">Nomination Time (seconds)</Label>
                    <Input
                      id="nominationSeconds"
                      type="number"
                      min="30"
                      max="120"
                      value={formData.nominationSeconds}
                      onChange={(e) => setFormData({ ...formData, nominationSeconds: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bidTurnSeconds">Bid Timer (seconds)</Label>
                    <Input
                      id="bidTurnSeconds"
                      type="number"
                      min="5"
                      max="30"
                      value={formData.bidTurnSeconds}
                      onChange={(e) => setFormData({ ...formData, bidTurnSeconds: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={isCreating || !formData.nickname.trim() || !user}
              >
                {isCreating ? "Creating Room..." : "Create Auction Room"}
              </Button>
            </form>
          </CricketCardContent>
        </CricketCard>
      </div>
    </div>
  );
};

export default CreateRoom;