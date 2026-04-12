import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Redirect to the unified CGU/CGV page
  useEffect(() => {
    navigate('/legal/sales-terms', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen relative" style={{ backgroundImage: 'url(/planification-demenagement-a-dom-tom.webp)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-slate-50/88 to-blue-50/90"></div>
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirection vers les CGU/CGV...</p>
          <button onClick={() => navigate('/legal/sales-terms')} className="mt-4 text-blue-600 hover:underline flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Voir les CGU/CGV
          </button>
        </div>
      </div>
    </div>
  );
}
