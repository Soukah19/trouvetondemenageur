import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

export function ClientGoogleCallbackPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (hasChecked.current) return;

    if (!user) {
      const timeout = setTimeout(() => {
        if (!hasChecked.current) {
          console.error('No user after timeout');
          navigate('/client/login');
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }

    hasChecked.current = true;

    const checkUserRole = async () => {
      try {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          showToast('Ce compte est un compte administrateur. Veuillez utiliser la connexion admin.', 'error');
          await signOut();
          navigate('/admin/login');
          return;
        }

        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (moverData) {
          showToast('Ce compte est déjà enregistré comme déménageur. Veuillez utiliser la connexion partenaire.', 'error');
          await signOut();
          navigate('/mover/login');
          return;
        }

        const { data: clientData } = await supabase
          .from('clients')
          .select('first_name, last_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clientData && clientData.first_name?.trim() && clientData.last_name?.trim() && clientData.phone?.trim()) {
          navigate('/client/dashboard', { replace: true });
        } else {
          // Create minimal client record if it doesn't exist yet
          if (!clientData) {
            try {
              await supabase
                .from('clients')
                .insert({
                  user_id: user.id,
                  email: user.email || '',
                  first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
                  last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                  phone: '',
                  created_at: new Date().toISOString(),
                });
              console.log('Minimal client record created for Google user');

              // Send welcome email only on FIRST signup (record just created)
              try {
                await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                      userType: 'client',
                      email: user.email || '',
                      record: {
                        first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
                      },
                    }),
                  }
                );
              } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
              }
            } catch (insertError) {
              console.error('Error creating minimal client record:', insertError);
            }
          }
          // clientData exists but incomplete → returning user, no email

          navigate('/client/profile-completion', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        showToast('Erreur lors de la vérification du compte', 'error');
        navigate('/client/login');
      }
    };

    checkUserRole();
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}