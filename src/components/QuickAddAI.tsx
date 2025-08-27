import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Bot, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickAddAIProps {
  roomId: string;
  isHost: boolean;
  playersCount: number;
  onAgentsAdded: () => void;
}

export const QuickAddAI: React.FC<QuickAddAIProps> = ({ 
  roomId, 
  isHost, 
  playersCount,
  onAgentsAdded 
}) => {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const handleAddAI = async () => {
    if (!isHost) return;
    
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('add_ai_agents', {
        body: { 
          roomId,
          count: 3 // Add 3 AI agents for quick testing
        }
      });

      if (error) throw error;

      toast({
        title: "AI Agents Added!",
        description: "3 AI agents have joined the room",
      });
      
      onAgentsAdded();
    } catch (error: any) {
      console.error('Add AI agents error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add AI agents",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  // Only show for host when there are very few participants
  if (!isHost || playersCount >= 4) {
    return null;
  }

  return (
    <CricketCard variant="auction" className="mb-4">
      <CricketCardHeader>
        <CricketCardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Quick Add AI Agents
        </CricketCardTitle>
      </CricketCardHeader>
      <CricketCardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Add AI agents to test the auction quickly with automatic bidding.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {playersCount} / 10 teams in room
          </div>
          <Button 
            onClick={handleAddAI}
            disabled={adding}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {adding ? (
              <>
                <Bot className="h-4 w-4 mr-2 animate-spin" />
                Adding AI...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add 3 AI Agents
              </>
            )}
          </Button>
        </div>
      </CricketCardContent>
    </CricketCard>
  );
};