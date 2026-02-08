import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useNavigationHelpers() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut } = useAuth();

  const handleClientLogin = async (email: string, password: string, redirectToQuote: boolean = false) => {
    await signIn(email, password);

    const { data: { user: loggedInUser } } = await supabase.auth.getUser();

    if (!loggedInUser) {
      throw new Error('Erreur de connexion');
    }

    // Vérifier si c'est un admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (adminData) {
      await signOut();
      throw new Error('Veuillez utiliser la connexion administrateur');
    }

    // Vérifier si c'est un déménageur
    const { data: moverData } = await supabase
      .from('movers')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (moverData) {
      await signOut();
      throw new Error('Veuillez utiliser la connexion partenaire');
    }

    const { data: existingQuotes } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('client_user_id', loggedInUser.id)
      .limit(1);

    if (existingQuotes && existingQuotes.length > 0) {
      navigate('/client/dashboard');
      return;
    }

    const metadata = loggedInUser.user_metadata || {};
    const hasCompleteProfile = metadata.first_name && metadata.last_name && metadata.phone;

    if (!hasCompleteProfile) {
      navigate('/client/profile-completion');
      return;
    }

    const { data: client } = await supabase
      .from('clients')
      .select('first_name, last_name, phone')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (!client || !client.first_name || !client.last_name || !client.phone) {
      navigate('/client/profile-completion');
      return;
    }

    navigate(redirectToQuote ? '/client/quote' : '/client/dashboard');
  };

  const handleClientSignup = async (email: string, password: string, redirectToQuote: boolean = false) => {
    const result = await signUp(email, password);

    if (result.needsEmailVerification) {
      // Rediriger directement vers la page de vérification par code
      navigate('/verify-email-code', { state: { email } });
    } else {
      await signIn(email, password);
      navigate('/client/profile-completion');
    }
  };

  const handleClientLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleMoverLogin = async (email: string, password: string) => {
    await signIn(email, password);

    const { data: { user: loggedInUser } } = await supabase.auth.getUser();

    if (!loggedInUser) {
      throw new Error('Erreur de connexion');
    }

    // Vérifier si c'est un admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (adminData) {
      // C'est un admin, rediriger vers le dashboard admin
      await signOut();
      throw new Error('Veuillez utiliser la connexion administrateur');
    }

    // Vérifier si c'est un déménageur
    const { data: moverData } = await supabase
      .from('movers')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (!moverData) {
      // Pas un déménageur, déconnecter
      await signOut();
      throw new Error('Compte déménageur non trouvé. Veuillez vous inscrire d\'abord.');
    }

    navigate('/mover/dashboard');
  };

  const handleMoverLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAdminLogin = async (email: string, password: string) => {
    await signIn(email, password);

    const { data: { user: loggedInUser } } = await supabase.auth.getUser();

    if (!loggedInUser) {
      throw new Error('Erreur de connexion');
    }

    // Vérifier si c'est bien un admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (!adminData) {
      await signOut();
      throw new Error('Accès non autorisé. Ce compte n\'est pas un compte administrateur.');
    }

    navigate('/admin/dashboard');
  };

  const handleAdminLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleGoogleClientLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/client/profile-completion`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const handleGoogleMoverLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/mover/signup`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  return {
    navigate,
    handleClientLogin,
    handleClientSignup,
    handleClientLogout,
    handleMoverLogin,
    handleMoverLogout,
    handleAdminLogin,
    handleAdminLogout,
    handleGoogleClientLogin,
    handleGoogleMoverLogin,
  };
}