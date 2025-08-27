import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    // Try anonymous sign-in first
    const { error: anonError } = await supabase.auth.signInAnonymously();
    if (!anonError) {
      return { error: null };
    }

    // If anonymous fails, try with a temporary email/password
    const tempEmail = `temp_${Date.now()}@auction.local`;
    const tempPassword = `temp_${Math.random().toString(36).substring(7)}`;
    
    const { error: signUpError } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
    });

    return { error: signUpError || anonError };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInAnonymously,
    signOut,
  };
}