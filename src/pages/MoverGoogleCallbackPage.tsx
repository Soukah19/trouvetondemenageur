import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

export function MoverGoogleCallbackPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Wait until AuthContext finishes loading AND we have a user
    if (loading) return;
    if (hasChecked.current) return;

    // If no user after loading is done, wait a bit more for PKCE exchange
    if (!user) {
      const timeout = setTimeout(() => {
        if (!hasChecked.current) {
          console.error('No user after timeout');
          navigate('/mover/login');
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
          showToast('Ce compte est un compte administrateur.', 'error');
          await signOut();
          navigate('/admin/login');
          return;
        }

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clientData) {
          showToast('Ce compte est déjà enregistré comme client. Veuillez utiliser la connexion client.', 'error');
          await signOut();
          navigate('/client/login');
          return;
        }

        const { data: moverData } = await supabase
          .from('movers')
          .select('id, company_name, siret, manager_firstname, manager_lastname')
          .eq('user_id', user.id)
          .maybeSingle();

        if (moverData) {
          // Check if profile info is complete
          const isInfoComplete = moverData.company_name?.trim() && moverData.siret?.trim() && moverData.manager_firstname?.trim() && moverData.manager_lastname?.trim();

          // Check if required documents are uploaded
          let hasRequiredDocs = false;
          if (isInfoComplete) {
            const { data: docs } = await supabase
              .from('verification_documents')
              .select('document_type')
              .eq('mover_id', moverData.id);

            const docTypes = (docs || []).map((d: any) => d.document_type);
            hasRequiredDocs = docTypes.includes('kbis') && docTypes.includes('insurance') && docTypes.includes('transport_license');
          }

          if (isInfoComplete && hasRequiredDocs) {
            navigate('/mover/dashboard', { replace: true });
          } else {
            navigate('/mover/profile-completion', { replace: true });
          }
        } else {
          // New mover via Google — create minimal mover record
          // so the user is saved as mover even if they don't complete profile now
          try {
            await supabase
              .from('movers')
              .insert({
                user_id: user.id,
                email: user.email || '',
                company_name: '',
                siret: '',
                phone: '',
                manager_firstname: user.user_metadata?.full_name?.split(' ')[0] || '',
                manager_lastname: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                manager_phone: '',
                address: '',
                city: '',
                postal_code: '',
                description: '',
                services: [],
                coverage_area: [],
                verification_status: 'pending',
                is_active: false,
              });
            console.log('Minimal mover record created for Google user');
          } catch (insertError) {
            console.error('Error creating minimal mover record:', insertError);
          }

          // Send welcome email (non-blocking)
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
                  userType: 'mover',
                  email: user.email || '',
                  userId: user.id,
                }),
              }
            );
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
          }

          navigate('/mover/profile-completion', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        showToast('Erreur lors de la vérification du compte', 'error');
        navigate('/mover/login');
      }
    };

    checkUserRole();
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}