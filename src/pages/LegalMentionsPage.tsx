import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LegalMentionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mentions Légales</h1>
              <p className="text-gray-600">Dernière mise à jour : 25 janvier 2026</p>
            </div>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Éditeur de la plateforme</h2>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p><strong>Nom de la plateforme :</strong> TrouveTonDemenageur</p>
                <p><strong>Forme juridique :</strong> [À compléter - ex: SAS au capital de XXX euros]</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>RCS :</strong> [Numéro d'immatriculation à compléter]</p>
                <p><strong>SIRET :</strong> [Numéro SIRET à compléter]</p>
                <p><strong>TVA intracommunautaire :</strong> [Numéro de TVA à compléter]</p>
                <p><strong>Directeur de la publication :</strong> [Nom à compléter]</p>
                <p><strong>Contact :</strong> contact@trouvetondemenageur.fr</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Nature de la plateforme</h2>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                <p className="font-semibold text-blue-900 mb-2">IMPORTANT : Rôle de mise en relation uniquement</p>
                <p className="text-gray-700">
                  TrouveTonDemenageur est une <strong>plateforme numérique de mise en relation</strong> entre des particuliers
                  et entreprises recherchant un service de déménagement (ci-après "les Clients") et des professionnels du
                  déménagement dûment immatriculés et assurés (ci-après "les Déménageurs").
                </p>
                <p className="text-gray-700 mt-3">
                  <strong>TrouveTonDemenageur ne réalise aucune prestation de déménagement.</strong> Nous ne sommes pas
                  déménageurs. Nous mettons uniquement en relation des professionnels indépendants avec des clients.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hébergement de la plateforme</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Hébergeur web :</strong> Vercel Inc.</p>
                  <p>340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                  <p>Site : https://vercel.com</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Hébergement des données :</strong> Supabase Inc.</p>
                  <p>970 Toa Payoh North, #07-04, Singapore 318992</p>
                  <p>Serveurs : Union Européenne (conformité RGPD)</p>
                  <p>Site : https://supabase.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Services proposés</h2>
              <p className="text-gray-700 mb-4">La plateforme TrouveTonDemenageur propose les services suivants :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Publication de demandes de devis de déménagement par les clients</li>
                <li>Consultation des demandes de devis par les déménageurs vérifiés</li>
                <li>Système de soumission et comparaison de devis</li>
                <li>Paiement sécurisé avec séquestre (via Stripe)</li>
                <li>Vérification des documents professionnels des déménageurs (KBIS, RC Pro, permis, assurances)</li>
                <li>Système de notation et d'avis vérifiés</li>
                <li>Messagerie sécurisée entre clients et déménageurs</li>
                <li>Suivi de mission et système de validation de fin de prestation</li>
                <li>Outil de déclaration de dommages</li>
                <li>Support et médiation en cas de litige</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Responsabilité et limites</h2>
              <div className="space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">5.1 Limitation stricte de responsabilité</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>TrouveTonDemenageur agit exclusivement en qualité d'intermédiaire technique.</strong>
                    La plateforme ne saurait en aucun cas être tenue responsable :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                    <li>De la qualité, de l'exécution ou du résultat des prestations effectuées par les déménageurs</li>
                    <li>Des dommages de toute nature causés aux biens</li>
                    <li>Des retards, absences, annulations ou manquements des déménageurs</li>
                    <li>Des litiges, différends ou conflits entre clients et déménageurs</li>
                    <li>De l'exactitude, de la véracité ou de la validité des informations fournies</li>
                    <li>De tout préjudice direct ou indirect résultant de l'utilisation de la plateforme</li>
                    <li>Des dysfonctionnements, interruptions ou erreurs de la plateforme</li>
                  </ul>
                  <p className="text-gray-700 mt-3 font-semibold">
                    Le contrat de déménagement est conclu directement et exclusivement entre le client et le déménageur,
                    sans intervention de TrouveTonDemenageur.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <h3 className="font-semibold text-green-900 mb-2">5.2 Services techniques fournis</h3>
                  <p className="text-gray-700">
                    Dans le cadre strict de son rôle d'intermédiaire, TrouveTonDemenageur met à disposition :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                    <li>Un système de vérification des documents fournis (sans garantie de validité)</li>
                    <li>Une infrastructure de paiement sécurisée via prestataires tiers</li>
                    <li>Des outils de notation et de communication</li>
                    <li>Un support technique pour l'utilisation de la plateforme</li>
                  </ul>
                  <p className="text-gray-700 text-sm italic mt-2">
                    Ces services sont fournis en l'état, sans garantie de résultat ou d'absence d'interruption.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Propriété intellectuelle</h2>
              <p className="text-gray-700">
                L'ensemble des éléments de la plateforme TrouveTonDemenageur (structure, design, textes, graphismes,
                logos, icônes, sons, logiciels) sont la propriété exclusive de TrouveTonDemenageur ou de ses partenaires.
              </p>
              <p className="text-gray-700 mt-3">
                Toute reproduction, représentation, modification, publication, transmission, ou dénaturation, totale ou
                partielle, est strictement interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Protection des données personnelles</h2>
              <p className="text-gray-700">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et
                Libertés, vous disposez de droits sur vos données personnelles.
              </p>
              <p className="text-gray-700 mt-3">
                Pour plus d'informations, consultez notre{' '}
                <Link to="/legal/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                  Politique de Confidentialité
                </Link>.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Responsable du traitement des données :</strong> TrouveTonDemenageur</p>
                <p><strong>Contact DPO :</strong> dpo@trouvetondemenageur.fr</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
              <p className="text-gray-700">
                La plateforme utilise des cookies essentiels au fonctionnement du service (authentification, sécurité).
                Aucun cookie publicitaire ou de tracking n'est utilisé sans votre consentement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Droit applicable et juridiction</h2>
              <p className="text-gray-700">
                Les présentes mentions légales sont régies par le droit français. En cas de litige, et après échec de
                toute tentative de recherche d'une solution amiable, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-700 mb-3">
                Pour toute question concernant les présentes mentions légales :
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Email :</strong> contact@trouvetondemenageur.fr</p>
                <p><strong>Email juridique :</strong> legal@trouvetondemenageur.fr</p>
                <p><strong>Téléphone :</strong> [Numéro à compléter]</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
