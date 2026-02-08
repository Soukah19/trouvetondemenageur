import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isEmailVerificationEnabled } from '../utils/emailVerification';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ needsEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour créer le client si nécessaire
  const ensureClientExists = async (userId: string, email: string) => {
    try {
      // Vérifier si le client existe déjà
      const { data: clientExists } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // Vérifier si c'est un déménageur
      const { data: moverExists } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // Créer le client seulement s'il n'existe pas et n'est pas un déménageur
      if (!clientExists && !moverExists) {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{
            user_id: userId,
            email: email
          }]);

        if (insertError) {
          console.error('Error creating client record:', insertError);
        } else {
          console.log('Client record created successfully');
        }
      }
    } catch (error) {
      console.error('Error in ensureClientExists:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // Si l'utilisateur est connecté et a confirmé son email, s'assurer que le client existe
      if (session?.user && session.user.email_confirmed_at) {
        ensureClientExists(session.user.id, session.user.email || '');
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);

        // Créer le client quand l'utilisateur se connecte avec un email vérifié
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUser = session.user;
          
          // Attendre un peu pour s'assurer que la session est bien établie
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Créer le client si l'email est confirmé (connexion Google ou email vérifié)
          if (currentUser.email_confirmed_at || currentUser.app_metadata?.provider === 'google') {
            await ensureClientExists(currentUser.id, currentUser.email || '');
          }
        }

        // Gérer le cas où l'utilisateur vient de vérifier son email
        if (event === 'USER_UPDATED' && session?.user) {
          const currentUser = session.user;
          if (currentUser.email_confirmed_at) {
            await ensureClientExists(currentUser.id, currentUser.email || '');
          }
        }

        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Vérifier si l'email est déjà utilisé par un déménageur
    const { data: existingMover } = await supabase
      .from('movers')
      .select('id, company_name')
      .eq('email', email)
      .maybeSingle();

    if (existingMover) {
      throw new Error(`Cette adresse email est déjà utilisée par une entreprise de déménagement (${existingMover.company_name}). Veuillez utiliser une autre adresse email ou vous connecter.`);
    }

    // Read email verification setting from utility
    const emailVerificationEnabled = isEmailVerificationEnabled();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailVerificationEnabled ? {
        // Ne pas spécifier de redirectTo pour que Supabase envoie un code OTP
        data: {
          email: email
        }
      } : {
        // Auto-confirm when email verification is disabled
        data: {
          email: email,
          email_verified: true
        }
      }
    });

    if (error) throw error;

    // Si la vérification email est désactivée, créer le client immédiatement
    // car l'utilisateur sera connecté directement
    if (!emailVerificationEnabled && data.user) {
      // L'utilisateur est automatiquement connecté, le client sera créé via onAuthStateChange
      console.log('Email verification disabled, user will be signed in automatically');
    }
    // Si la vérification est activée, le client sera créé après la confirmation de l'email
    // via l'événement SIGNED_IN ou USER_UPDATED dans onAuthStateChange

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
    
    // Clear all localStorage data on logout
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