import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Copy, Crown, Users, DollarSign, Timer } from 'lucide-react';
import { AuctionRoom } from '@/types/auction';
import { useToast } from '@/hooks/use-toast';

interface RoomHeaderProps {
  room: AuctionRoom;
  isHost: boolean;
  participantCount: number;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  isHost,
  participantCount,
}) => {
  const { toast } = useToast();

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    toast({
      title: "Room Code Copied!",
      description: `Code ${room.code} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'active': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for Players';
      case 'active': return 'Auction Active';
      case 'completed': return 'Auction Completed';
      default: return status;
    }
  };

  return (
    <CricketCard variant="glow">
      <CricketCardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CricketCardTitle className="text-2xl mb-2">
              IPL Auction Room
              {isHost && (
                <Crown className="inline ml-2 h-5 w-5 text-primary" />
              )}
            </CricketCardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomCode}
                className="font-mono"
              >
                <Copy className="mr-2 h-4 w-4" />
                {room.code}
              </Button>
              <Badge className={getStatusColor(room.status)}>
                {getStatusText(room.status)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{participantCount}/10</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>₹{room.purse_cr} Cr</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span>{room.bid_turn_seconds}s</span>
            </div>
          </div>
        </div>
      </CricketCardHeader>
    </CricketCard>
  );
};