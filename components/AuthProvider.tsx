'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user:               User | null;
  loading:            boolean;
  signInWithGithub:   () => Promise<void>;
  signInWithEmail:    (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail:    (opts: SignUpOpts) => Promise<{ error: string | null }>;
  signOut:            () => Promise<void>;
}

interface SignUpOpts {
  email:       string;
  password:    string;
  displayName: string;
  location:    string;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  signInWithGithub:  async () => {},
  signInWithEmail:   async () => ({ error: null }),
  signUpWithEmail:   async () => ({ error: null }),
  signOut:           async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async ({ email, password, displayName, location }: SignUpOpts) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { error: error.message };

    // Upsert profile with name + location
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:           data.user.id,
        email,
        display_name: displayName,
        full_name:    displayName,
        location,
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGithub, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
