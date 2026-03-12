'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Doctor, Pharmacy, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  doctor: Doctor | null;
  pharmacy: Pharmacy | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    doctor: null,
    pharmacy: null,
    role: null,
    loading: true,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    // Check if user is a doctor
    const { data: doctor } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (doctor) {
      setState((prev) => ({
        ...prev,
        doctor,
        role: 'doctor',
        loading: false,
      }));
      return;
    }

    // Check if user is a pharmacy
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pharmacy) {
      setState((prev) => ({
        ...prev,
        pharmacy,
        role: 'pharmacy',
        loading: false,
      }));
      return;
    }

    // No role found
    setState((prev) => ({ ...prev, loading: false }));
  }, [supabase]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user }));
        await fetchProfile(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setState((prev) => ({ ...prev, user: session.user }));
          await fetchProfile(session.user.id);
        } else {
          setState({
            user: null,
            doctor: null,
            pharmacy: null,
            role: null,
            loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    profileData: Record<string, unknown>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) throw error;

    if (data.user) {
      if (role === 'doctor') {
        const { error: profileError } = await supabase.from('doctors').insert({
          user_id: data.user.id,
          email,
          ...profileData,
        });
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase.from('pharmacies').insert({
          user_id: data.user.id,
          email,
          ...profileData,
        });
        if (profileError) throw profileError;
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    supabase,
  };
}
