import { CheckCircle, ArrowRight, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoverSignupSuccess() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464119/pexels-photo-7464119.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-green-50/85 to-blue-50/88"></div>
      <div className="relative w-full flex items-center justify-center">
      
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>
<div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Merci pour votre inscription !
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Votre demande d'adhésion à TrouveTonDemenageur a bien été enregistrée. Notre équipe va maintenant vérifier vos documents.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">Prochaines étapes :</h3>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-lg flex-shrink-0">✓</span>
                <span>Votre dossier est en cours de vérification par notre équipe</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 text-lg flex-shrink-0">•</span>
                <span>Nous examinerons vos informations et documents sous 48 heures ouvrées</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 text-lg flex-shrink-0">•</span>
                <span><strong>Un email de bienvenue vous sera envoyé dès validation de votre compte</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 text-lg flex-shrink-0">•</span>
                <span>Vous pourrez alors accéder aux demandes de devis et commencer à développer votre activité</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Retour à la page d'accueil</span>
            </button>

            <p className="text-sm text-gray-500 mt-4">
              Vous recevrez une notification par email à chaque étape de la validation de votre compte.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
