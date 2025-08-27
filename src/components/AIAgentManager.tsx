import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Bot, Users, Zap, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RoomPlayer } from '@/types/auction';

interface AIAgentManagerProps {
  roomId: string;
  players: RoomPlayer[];
  isHost: boolean;
  maxTeams?: number;
  onAgentsAdded?: () => void;
}

export const AIAgentManager: React.FC<AIAgentManagerProps> = ({
  roomId,
  players,
  isHost,
  maxTeams = 10,
  onAgentsAdded,
}) => {
  const { toast } = useToast();
  const [isAddingAgents, setIsAddingAgents] = useState(false);

  const humanPlayers = players.filter(p => !p.is_ai);
  const aiPlayers = players.filter(p => p.is_ai);
  const availableSlots = maxTeams - players.length;

  const addAIAgents = async (count: number) => {
    setIsAddingAgents(true);
    try {
      const { data, error } = await supabase.functions.invoke('add_ai_agents', {
        body: { roomId, count },
      });

      if (error) throw error;

      toast({
        title: "AI Agents Added!",
        description: `Successfully added ${data.agents?.length || count} AI agent(s)`,
      });

      onAgentsAdded?.();
    } catch (error: any) {
      console.error('Error adding AI agents:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add AI agents",
        variant: "destructive",
      });
    } finally {
      setIsAddingAgents(false);
    }
  };

  if (!isHost) {
    return null;
  }

  return (
    <CricketCard variant="auction" className="mb-4">
      <CricketCardHeader>
        <CricketCardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agent Manager
        </CricketCardTitle>
      </CricketCardHeader>
      <CricketCardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">Human Players</p>
              <p className="font-bold text-lg">{humanPlayers.length}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Bot className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-muted-foreground">AI Agents</p>
              <p className="font-bold text-lg">{aiPlayers.length}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Zap className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">Available Slots</p>
              <p className="font-bold text-lg">{availableSlots}</p>
            </div>
          </div>

          {/* AI Agent Features */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Features
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Smart player nominations based on team needs</li>
              <li>• Strategic bidding with budget management</li>
              <li>• Different AI personalities and strategies</li>
              <li>• Real-time decision making during auctions</li>
            </ul>
          </div>

          {/* Add AI Agents */}
          {availableSlots > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Add AI Agents</h4>
              <p className="text-sm text-muted-foreground">
                AI agents will automatically participate in the auction, making strategic bids and nominations.
              </p>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => addAIAgents(1)}
                  disabled={isAddingAgents || availableSlots < 1}
                  variant="outline"
                  size="sm"
                >
                  Add 1 AI Agent
                </Button>
                
                {availableSlots >= 3 && (
                  <Button
                    onClick={() => addAIAgents(3)}
                    disabled={isAddingAgents || availableSlots < 3}
                    variant="outline"
                    size="sm"
                  >
                    Add 3 AI Agents
                  </Button>
                )}
                
                {availableSlots >= 5 && (
                  <Button
                    onClick={() => addAIAgents(Math.min(5, availableSlots))}
                    disabled={isAddingAgents}
                    className="bg-gradient-to-r from-primary to-accent"
                    size="sm"
                  >
                    Fill with AI ({Math.min(5, availableSlots)} agents)
                  </Button>
                )}
              </div>
              
              {isAddingAgents && (
                <p className="text-sm text-muted-foreground">
                  Adding AI agents... They will join with random team assignments.
                </p>
              )}
            </div>
          )}

          {availableSlots === 0 && (
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-700 font-medium">All teams filled!</p>
              <p className="text-sm text-green-600">Ready to start the auction</p>
            </div>
          )}

          {aiPlayers.length > 0 && (
            <div className="pt-3 border-t">
              <h4 className="font-semibold mb-2">Current AI Agents</h4>
              <div className="space-y-2">
                {aiPlayers.slice(0, 3).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span>{agent.nickname}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {agent.team?.short_name}
                    </span>
                  </div>
                ))}
                {aiPlayers.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{aiPlayers.length - 3} more AI agents
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CricketCardContent>
    </CricketCard>
  );
};