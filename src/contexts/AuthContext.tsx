import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isEmailVerificationEnabled } from '../utils/emailVerification';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData?: { firstName: string; lastName: string; phone: string }) => Promise<{ needsEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // NOTE: ensureClientExists has been REMOVED from AuthContext.
  // Client records are now created explicitly by:
  // - handleClientSignup (useNavigationHelpers.ts) for manual signup
  // - ClientProfileCompletionPage for Google auth signup
  // - ClientGoogleCallbackPage redirects to profile-completion
  // This prevents auto-creating client records for mover Google signups.

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      // Handle PKCE exchange errors (stale code, expired code, etc.)
      console.error('Error getting session:', error);
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, profileData?: { firstName: string; lastName: string; phone: string }) => {
    const emailVerificationEnabled = isEmailVerificationEnabled();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailVerificationEnabled ? {
        data: {
          email: email,
          ...(profileData ? {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
          } : {})
        }
      } : {
        data: {
          email: email,
          email_verified: true,
          ...(profileData ? {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
          } : {})
        }
      }
    });

    if (error) throw error;

    console.log('[DEV] Signup response:', data);
    if (data.user) {
      console.log('[DEV] User ID:', data.user.id, '| Email confirmed:', data.user.email_confirmed_at);
    }

    return {
      needsEmailVerification: emailVerificationEnabled && !data.user?.email_confirmed_at
    };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}