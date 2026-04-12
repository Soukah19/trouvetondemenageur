import { CheckCircle, FileText, Calendar, Phone, Mail, Shield, AlertTriangle } from 'lucide-react';
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Félicitations, votre déménagement est réservé !</h1>
          <p className="text-slate-600">
            Votre réservation a été validée avec succès via la plateforme TROUVE TON DÉMÉNAGEUR.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Récapitulatif financier
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</span>
              <p><strong>Frais de réservation (30 %)</strong> — Les frais de réservation ont été réglés via la plateforme. Ces frais correspondent à la commission de mise en relation et ne constituent pas un acompte sur la prestation de déménagement.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</span>
              <p><strong>Solde de la prestation (70 %)</strong> — Le solde est réglé directement entre vous et le Déménageur au moment de l'exécution de la prestation. TTD n'intervient pas dans ce paiement.</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Protocole de preuve numérique
          </h2>
          <p className="text-sm text-green-800 mb-2">Finalisez votre inventaire photographique via votre Espace Client avant l'arrivée du Déménageur. Les clichés horodatés permettent d'établir un état visuel de référence.</p>
          <p className="text-sm text-green-800">En cas de dommage déclaré, ces éléments peuvent être analysés pour faciliter la constitution d'un dossier auprès de l'assurance du Déménageur.</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Informations importantes</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="mb-1"><strong>Conditions d'annulation :</strong></p>
                <ul className="space-y-1 ml-2">
                  <li className="text-green-700">✓ ≥ 14 jours avant : remboursement intégral (hors frais Stripe)</li>
                  <li className="text-yellow-700">! Entre 10 et 13 jours : 50 % des frais conservés</li>
                  <li className="text-red-700">✗ &lt; 10 jours : frais intégralement conservés</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p><strong>Déclaration de dommage :</strong> Vous disposez de 48 heures après la fin de la prestation pour déclarer tout dommage via votre Espace Client, avec photos et descriptif.</p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p><strong>Contact déménageur :</strong> Les coordonnées complètes du déménageur sont dans la lettre de mission envoyée par email.</p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p><strong>Support :</strong> support@trouvetondemenageur.fr — 01.89.70.78.81</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Rappel :</strong> Retrouvez à tout moment vos documents (facture de réservation, contrat de transport et inventaire numérique) sur votre tableau de bord sécurisé. Vérifiez également votre boîte email (et vos spams) pour la lettre de mission.
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
