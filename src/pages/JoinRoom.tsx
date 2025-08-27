import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const JoinRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    nickname: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsJoining(true);
    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('auction_rooms')
        .select('id, status')
        .eq('code', formData.code)
        .single();

      if (roomError || !room) {
        throw new Error('Room not found');
      }

      if (room.status === 'completed') {
        throw new Error('This auction has already completed');
      }

      toast({
        title: "Room Found!",
        description: "Redirecting to room...",
      });

      navigate(`/room/${room.id}?nickname=${encodeURIComponent(formData.nickname)}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <CricketCard variant="auction">
          <CricketCardHeader>
            <CricketCardTitle className="text-2xl text-center">Join Auction Room</CricketCardTitle>
          </CricketCardHeader>
          <CricketCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Room Details</h3>
              </div>
              
              <div>
                <Label htmlFor="code">Room Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Enter 6-digit room code"
                  maxLength={6}
                  required
                />
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

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={isJoining || !formData.code || !formData.nickname || formData.code.length !== 6}
              >
                {isJoining ? "Joining Room..." : "Join Auction Room"}
              </Button>
            </form>
          </CricketCardContent>
        </CricketCard>
      </div>
    </div>
  );
};

export default JoinRoom;