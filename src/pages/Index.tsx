import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CricketCard, CricketCardContent, CricketCardDescription, CricketCardHeader, CricketCardTitle } from '@/components/ui/cricket-card';
import { Plus, Users, Trophy, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isSigningIn) {
      handleSignIn();
    }
  }, [loading, user, isSigningIn]);

  const handleSignIn = async () => {
    if (isSigningIn) return; // Prevent multiple calls
    
    setIsSigningIn(true);
    try {
      const { error } = await signInAnonymously();
      if (error) {
        console.error('Error signing in:', error);
        toast({
          title: "Authentication Error",
          description: "Please try refreshing the page or continue without authentication.",
          variant: "destructive",
        });
        // Don't block the UI if auth fails - let users proceed
        setIsSigningIn(false);
        return;
      }
    } catch (err) {
      console.error('Unexpected error during sign-in:', err);
      toast({
        title: "Authentication Error", 
        description: "Authentication failed. You can still browse the app.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              IPL Auction
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the thrill of building your dream cricket team in real-time. 
            Create or join an auction room and compete with friends!
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[var(--shadow-auction)] transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Auction Room
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleJoinRoom}
              className="border-primary/30 hover:border-primary/60 hover:bg-primary/5"
            >
              <Users className="mr-2 h-5 w-5" />
              Join Auction Room
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <CricketCard variant="auction">
            <CricketCardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Timer className="h-6 w-6 text-primary" />
              </div>
              <CricketCardTitle>Real-time Bidding</CricketCardTitle>
            </CricketCardHeader>
            <CricketCardContent>
              <CricketCardDescription className="text-center">
                Experience live auction dynamics with timed bidding rounds and instant updates across all participants.
              </CricketCardDescription>
            </CricketCardContent>
          </CricketCard>

          <CricketCard variant="auction">
            <CricketCardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CricketCardTitle>Team Management</CricketCardTitle>
            </CricketCardHeader>
            <CricketCardContent>
              <CricketCardDescription className="text-center">
                Build your squad with strategic thinking, budget management, and player role balancing.
              </CricketCardDescription>
            </CricketCardContent>
          </CricketCard>

          <CricketCard variant="auction">
            <CricketCardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CricketCardTitle>AI Analysis</CricketCardTitle>
            </CricketCardHeader>
            <CricketCardContent>
              <CricketCardDescription className="text-center">
                Get detailed squad ratings and strategic insights powered by AI to improve your team building.
              </CricketCardDescription>
            </CricketCardContent>
          </CricketCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
