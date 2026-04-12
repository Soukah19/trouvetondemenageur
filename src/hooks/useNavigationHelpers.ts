import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useNavigationHelpers() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut } = useAuth();

  const handleClientLogin = async (email: string, password: string, redirectToQuote: boolean = false) => {
    try {
      await signIn(email, password);
    } catch (signInError: any) {
      if (signInError.message?.toLowerCase().includes('invalid login credentials') || 
          signInError.message?.toLowerCase().includes('invalid credentials')) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-email-exists`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ email: email.toLowerCase().trim() }),
            }
          );
          const checkResult = await response.json();
          if (checkResult.exists && checkResult.provider === 'google') {
            throw new Error('This email is registered using Google. Please sign in with Google.');
          }
        } catch (checkError: any) {
          if (checkError.message?.includes('Google')) {
            throw checkError;
          }
        }
      }
      throw signInError;
    }

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

  const handleClientSignup = async (email: string, password: string, redirectToQuote: boolean = false, profileData?: { firstName: string; lastName: string; phone: string }) => {
    // Call send-signup-otp Edge Function — this does NOT create an auth user
    // It stores the signup data in pending_signups and sends an OTP email
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signup-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          userType: 'client',
          profileData: profileData || {},
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Erreur lors de l\'inscription');
    }

    // Redirect to OTP verification page — pass password so we can verify it later
    navigate('/verify-email-code', {
      state: {
        email: email.toLowerCase().trim(),
        password,
        profileData,
        userType: 'client',
      },
    });
  };

  const handleClientLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleMoverLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
    } catch (signInError: any) {
      if (signInError.message?.toLowerCase().includes('invalid login credentials') || 
          signInError.message?.toLowerCase().includes('invalid credentials')) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-email-exists`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ email: email.toLowerCase().trim() }),
            }
          );
          const checkResult = await response.json();
          if (checkResult.exists && checkResult.provider === 'google') {
            throw new Error('This email is registered using Google. Please sign in with Google.');
          }
        } catch (checkError: any) {
          if (checkError.message?.includes('Google')) {
            throw checkError;
          }
        }
      }
      throw signInError;
    }

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
      .select('id, company_name, siret, phone, manager_firstname, manager_lastname')
      .eq('user_id', loggedInUser.id)
      .maybeSingle();

    if (!moverData) {
      await signOut();
      throw new Error('Compte déménageur non trouvé. Veuillez vous inscrire d\'abord.');
    }

    // Check if profile info is complete
    const isInfoComplete = moverData.company_name?.trim() && moverData.siret?.trim() && moverData.manager_firstname?.trim() && moverData.manager_lastname?.trim();

    // Check if required documents are uploaded (kbis, insurance, transport_license)
    let hasRequiredDocs = false;
    if (isInfoComplete) {
      const { data: docs } = await supabase
        .from('verification_documents')
        .select('document_type')
        .eq('mover_id', moverData.id);

      const docTypes = (docs || []).map(d => d.document_type);
      hasRequiredDocs = docTypes.includes('kbis') && docTypes.includes('insurance') && docTypes.includes('transport_license');
    }

    if (!isInfoComplete || !hasRequiredDocs) {
      navigate('/mover/profile-completion');
    } else {
      navigate('/mover/dashboard');
    }
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
    navigate('/admin/login');
  };

  const handleGoogleClientLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/client/google-callback`,
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
        redirectTo: `${window.location.origin}/mover/google-callback`,
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