import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { ClientQuotePage } from './pages/ClientQuotePage';
import { ClientAuthPage } from './pages/ClientAuthPage';
import { ClientAuthChoice } from './pages/ClientAuthChoice';
import { ClientDashboard } from './pages/ClientDashboard';
import ClientQuotesPage from './pages/ClientQuotesPage';
import ClientPaymentPage from './pages/ClientPaymentPage';
import ClientPaymentSuccessPage from './pages/ClientPaymentSuccessPage';
import ClientContractsPage from './pages/ClientContractsPage';
import ClientNotificationsPage from './pages/ClientNotificationsPage';
import ClientPhotosPage from './pages/ClientPhotosPage';
import ClientChecklistPage from './pages/ClientChecklistPage';
import ClientFavoritesPage from './pages/ClientFavoritesPage';
import { MoverAuthPage } from './pages/MoverAuthPage';
import { MoverSignupPage } from './pages/MoverSignupPage';
import MoverProfileCompletionPage from './pages/MoverProfileCompletionPage';
import MoverEmailSignup from './components/MoverEmailSignup';
import MoverVerifyEmailPage from './pages/MoverVerifyEmailPage';
import { MoverSignupSuccess } from './pages/MoverSignupSuccess';
import { MoverDashboard } from './pages/MoverDashboard';
import MoverQuoteRequestsPage from './pages/MoverQuoteRequestsPage';
import MoverMyQuotesPage from './pages/MoverMyQuotesPage';
import MoverMovingsList from './pages/MoverMovingsList';
import MoverDamagePhotos from './pages/MoverDamagePhotos';
import MoverFinancesPage from './pages/MoverFinancesPage';
import MoverContractsPage from './pages/MoverContractsPage';
import MoverDocumentsPage from './pages/MoverDocumentsPage';
import MoverPortfolioPage from './pages/MoverPortfolioPage';
import MoverCompanyInfoPage from './pages/MoverCompanyInfoPage';
import MoverNotificationsPage from './pages/MoverNotificationsPage';
import MovingTracking from './pages/MovingTracking';
import DamageReport from './pages/DamageReport';
import { AdminAuthPage } from './pages/AdminAuthPage';
import AdminDashboard from './pages/AdminDashboard';
import { AboutUsPage } from './pages/AboutUsPage';
import { MissionPage } from './pages/MissionPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { TechnologyPage } from './pages/TechnologyPage';
import { PricingPage } from './pages/PricingPage';
import { PressPage } from './pages/PressPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { MovingGuidePage } from './pages/MovingGuidePage';
import { BlogPage } from './pages/BlogPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { CheckEmailPage } from './pages/CheckEmailPage';
import { ResendVerificationPage } from './pages/ResendVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResetPasswordWithCodePage } from './pages/ResetPasswordWithCodePage';
import { EmailVerificationCodePage } from './pages/EmailVerificationCodePage';
import { ClientProfileCompletionPage } from './pages/ClientProfileCompletionPage';
import LegalMentionsPage from './pages/LegalMentionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SalesTermsPage from './pages/SalesTermsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ToastContainer } from './components/ToastContainer';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Route protégée pour les clients uniquement
function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [userType, setUserType] = useState<'client' | 'mover' | 'admin' | 'unknown'>('unknown');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Reset state when user changes
    setChecking(true);
    setIsAuthorized(false);
    setUserType('unknown');

    const checkClientAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Vérifier si admin en premier (priorité haute) - ADMINS CANNOT ACCESS CLIENT PAGES
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          setUserType('admin');
          setIsAuthorized(false); // Admins cannot access client pages
          setChecking(false);
          return;
        }

        // Vérifier si déménageur
        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (moverData) {
          setUserType('mover');
          setIsAuthorized(false); // Movers cannot access client pages
          setChecking(false);
          return;
        }

        // C'est un client ou un utilisateur standard
        setUserType('client');
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking client access:', error);
        setIsAuthorized(false);
      } finally {
        setChecking(false);
      }
    };

    checkClientAccess();
  }, [user?.id]); // Depend on user.id instead of user object

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/client/login" replace />;
  }

  if (!isAuthorized) {
    return <UnauthorizedPage userType={userType} attemptedRoute={location.pathname} />;
  }

  return <>{children}</>;
}

function MoverProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [userType, setUserType] = useState<'client' | 'mover' | 'admin' | 'unknown'>('unknown');
  const [isMover, setIsMover] = useState(false);

  useEffect(() => {
    // Reset state when user changes
    setChecking(true);
    setIsMover(false);
    setUserType('unknown');

    const checkMoverAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Vérifier si admin en premier
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          setUserType('admin');
          setIsMover(false);
          setChecking(false);
          return;
        }

        // Vérifier si déménageur
        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (moverData) {
          setUserType('mover');
          setIsMover(true);
        } else {
          setUserType('client');
          setIsMover(false);
        }
      } catch (error) {
        console.error('Error checking mover access:', error);
        setIsMover(false);
      } finally {
        setChecking(false);
      }
    };

    checkMoverAccess();
  }, [user?.id]); // Depend on user.id

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/mover/login" replace />;
  }

  if (!isMover) {
    return <UnauthorizedPage userType={userType} attemptedRoute={location.pathname} />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [userType, setUserType] = useState<'client' | 'mover' | 'admin' | 'unknown'>('unknown');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Reset state when user changes
    setChecking(true);
    setIsAdmin(false);
    setUserType('unknown');

    const checkAdminAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          setUserType('admin');
          setIsAdmin(true);
        } else {
          // Vérifier si déménageur
          const { data: moverData } = await supabase
            .from('movers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (moverData) {
            setUserType('mover');
          } else {
            setUserType('client');
          }
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminAccess();
  }, [user?.id]); // Depend on user.id

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <UnauthorizedPage userType={userType} attemptedRoute={location.pathname} />;
  }

  return <>{children}</>;
}

// Composant pour rediriger les utilisateurs authentifiés vers leur dashboard
function RedirectIfAuthenticated({ children, fallbackType }: { children: React.ReactNode; fallbackType: 'client' | 'mover' | 'admin' }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when user changes
    setChecking(true);
    setRedirectTo(null);

    const checkUserType = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Vérifier si admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          setRedirectTo('/admin/dashboard');
          setChecking(false);
          return;
        }

        // Vérifier si déménageur
        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (moverData) {
          setRedirectTo('/mover/dashboard');
          setChecking(false);
          return;
        }

        // C'est un client
        setRedirectTo('/client/dashboard');
      } catch (error) {
        console.error('Error checking user type:', error);
        setRedirectTo(null);
      } finally {
        setChecking(false);
      }
    };

    checkUserType();
  }, [user?.id]); // Depend on user.id

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <div className="min-h-screen smooth-scroll">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/guide" element={<MovingGuidePage />} />
          <Route path="/blog" element={<BlogPage />} />

          {/* Legal Routes */}
          <Route path="/legal/mentions" element={<LegalMentionsPage />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/legal/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/legal/sales-terms" element={<SalesTermsPage />} />

          {/* Client Auth Routes - Redirect if already authenticated */}
          <Route path="/client/auth-choice" element={
            <RedirectIfAuthenticated fallbackType="client">
              <ClientAuthChoice />
            </RedirectIfAuthenticated>
          } />
          <Route path="/client/login" element={
            <RedirectIfAuthenticated fallbackType="client">
              <ClientAuthPage initialMode="login" />
            </RedirectIfAuthenticated>
          } />
          <Route path="/client/signup" element={
            <RedirectIfAuthenticated fallbackType="client">
              <ClientAuthPage initialMode="signup" />
            </RedirectIfAuthenticated>
          } />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/verify-email-code" element={<EmailVerificationCodePage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password-code" element={<ResetPasswordWithCodePage />} />

          {/* Client Protected Routes */}
          <Route
            path="/client/profile-completion"
            element={
              <ProtectedRoute>
                <ClientProfileCompletionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/dashboard"
            element={
              <ClientProtectedRoute>
                <ClientDashboard />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/quote"
            element={
              <ClientProtectedRoute>
                <ClientQuotePage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/quote/:quoteRequestId/edit"
            element={
              <ClientProtectedRoute>
                <ClientQuotePage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/quotes"
            element={
              <ClientProtectedRoute>
                <ClientQuotesPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/payment/:quoteId"
            element={
              <ClientProtectedRoute>
                <ClientPaymentPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/payment-success"
            element={
              <ClientProtectedRoute>
                <ClientPaymentSuccessPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/moving/:quoteRequestId/tracking"
            element={
              <ClientProtectedRoute>
                <MovingTracking />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/moving/:quoteRequestId/damage-report"
            element={
              <ClientProtectedRoute>
                <DamageReport />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/contracts"
            element={
              <ClientProtectedRoute>
                <ClientContractsPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/notifications"
            element={
              <ClientProtectedRoute>
                <ClientNotificationsPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/moving/:quoteRequestId/photos"
            element={
              <ClientProtectedRoute>
                <ClientPhotosPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/checklist"
            element={
              <ClientProtectedRoute>
                <ClientChecklistPage />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/favorites"
            element={
              <ClientProtectedRoute>
                <ClientFavoritesPage />
              </ClientProtectedRoute>
            }
          />

          {/* Mover Auth Routes */}
          <Route path="/mover/login" element={
            <RedirectIfAuthenticated fallbackType="mover">
              <MoverAuthPage />
            </RedirectIfAuthenticated>
          } />
          
          {/* PHASE 1: Email & Password Signup */}
          <Route path="/mover/signup" element={
            <RedirectIfAuthenticated fallbackType="mover">
              <MoverEmailSignup />
            </RedirectIfAuthenticated>
          } />
          
          {/* PHASE 2: Email Verification with 8-digit Code */}
          <Route path="/mover/verify-email" element={<MoverVerifyEmailPage />} />
          
          {/* PHASE 3: Profile Completion (Company Info + Documents) */}
          <Route path="/mover/profile-completion" element={
            <ProtectedRoute requireAuth>
              <MoverProfileCompletionPage />
            </ProtectedRoute>
          } />
          
          <Route path="/mover/signup-success" element={<MoverSignupSuccess />} />

          {/* Mover Protected Routes */}
          <Route
            path="/mover/dashboard"
            element={
              <MoverProtectedRoute>
                <MoverDashboard />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/quote-requests"
            element={
              <MoverProtectedRoute>
                <MoverQuoteRequestsPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/my-quotes"
            element={
              <MoverProtectedRoute>
                <MoverMyQuotesPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/my-quotes/:quoteRequestId"
            element={
              <MoverProtectedRoute>
                <MoverMyQuotesPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/movings"
            element={
              <MoverProtectedRoute>
                <MoverMovingsList />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/damage-photos"
            element={
              <MoverProtectedRoute>
                <MoverDamagePhotos />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/finances"
            element={
              <MoverProtectedRoute>
                <MoverFinancesPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/contracts"
            element={
              <MoverProtectedRoute>
                <MoverContractsPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/documents"
            element={
              <MoverProtectedRoute>
                <MoverDocumentsPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/portfolio"
            element={
              <MoverProtectedRoute>
                <MoverPortfolioPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/company-info"
            element={
              <MoverProtectedRoute>
                <MoverCompanyInfoPage />
              </MoverProtectedRoute>
            }
          />
          <Route
            path="/mover/notifications"
            element={
              <MoverProtectedRoute>
                <MoverNotificationsPage />
              </MoverProtectedRoute>
            }
          />

          {/* Admin Routes - Redirect if already authenticated */}
          <Route path="/admin/login" element={
            <RedirectIfAuthenticated fallbackType="admin">
              <AdminAuthPage />
            </RedirectIfAuthenticated>
          } />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
