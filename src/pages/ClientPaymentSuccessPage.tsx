import { CheckCircle, FileText, Calendar, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClientLayout } from '../components/ClientLayout';

interface ClientPaymentSuccessPageProps {
  onContinue: () => void;
}

export default function ClientPaymentSuccessPage({onContinue }: ClientPaymentSuccessPageProps) {
  const navigate = useNavigate();
  return (
    <ClientLayout title="Paiement confirmé">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Paiement confirmé !</h1>
          <p className="text-slate-600">
            Votre acompte a été versé avec succès
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prochaines étapes
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                1
              </span>
              <p>
                <strong>Lettre de mission envoyée</strong> - Vous recevrez par email la lettre de mission avec toutes les informations du déménageur (nom, téléphone, email).
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                2
              </span>
              <p>
                <strong>Le jour du déménagement</strong> - Vous réglerez le solde restant (60%) directement au déménageur à la fin du service.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Informations importantes</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Annulation gratuite :</strong> Vous pouvez annuler gratuitement jusqu'à 7 jours avant la date du déménagement (remboursement à 100%).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Contact déménageur :</strong> Les coordonnées complètes du déménageur sont dans la lettre de mission envoyée par email.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Support :</strong> Notre équipe est disponible pour toute question concernant votre réservation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Rappel :</strong> Vérifiez votre boîte email (et vos spams) pour la lettre de mission contenant toutes les informations du déménageur.
          </p>
        </div>

        <button
          onClick={() => navigate('/client/dashboard')}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Retour au tableau de bord
        </button>
        </div>
      </div>
    </ClientLayout>
  );
}
