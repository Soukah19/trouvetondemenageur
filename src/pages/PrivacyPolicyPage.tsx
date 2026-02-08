import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function PrivacyPolicyPage() {
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
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Politique de Confidentialité</h1>
              <p className="text-gray-600">Dernière mise à jour : 25 janvier 2026</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
            <p className="text-gray-700">
              <strong>TrouveTonDemenageur</strong> traite vos données personnelles conformément au
              Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              Cette politique décrit les traitements effectués dans le cadre strict de notre rôle d'intermédiaire technique.
            </p>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Responsable du traitement</h2>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p><strong>Responsable :</strong> TrouveTonDemenageur</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>Email DPO :</strong> dpo@trouvetondemenageur.fr</p>
                <p><strong>Contact :</strong> contact@trouvetondemenageur.fr</p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Données collectées</h2>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-green-500 bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900 mb-2">2.1 Pour les Clients</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                    <li><strong>Données de déménagement :</strong> adresses de départ et d'arrivée, date souhaitée,
                    volume estimé, type de logement, étage, présence d'ascenseur</li>
                    <li><strong>Inventaire :</strong> liste des meubles et objets à déménager (optionnel)</li>
                    <li><strong>Photos :</strong> photos des meubles pour estimation (optionnel)</li>
                    <li><strong>Données de paiement :</strong> traitées par Stripe (nous ne stockons pas vos données bancaires)</li>
                    <li><strong>Données de connexion :</strong> adresse IP, logs de connexion</li>
                    <li><strong>Avis et notes :</strong> évaluations laissées sur les déménageurs</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">2.2 Pour les Déménageurs</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                    <li><strong>Données professionnelles :</strong> nom de l'entreprise, SIRET, adresse du siège</li>
                    <li><strong>Documents obligatoires :</strong> KBIS, RC Professionnelle, assurance véhicule,
                    permis de conduire, carte grise, attestation Urssaf, MSA</li>
                    <li><strong>Zones d'intervention :</strong> départements couverts</li>
                    <li><strong>Tarifs :</strong> grille tarifaire pour calcul automatique</li>
                    <li><strong>Photos :</strong> photos de véhicules, équipes (portfolio)</li>
                    <li><strong>Données bancaires :</strong> RIB pour les paiements (via Stripe Connect)</li>
                    <li><strong>Avis et notes :</strong> évaluations reçues des clients</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 bg-purple-50 p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">2.3 Pour les Administrateurs</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Données d'identification :</strong> nom, prénom, email, username</li>
                    <li><strong>Données de connexion :</strong> logs d'accès au panel admin</li>
                    <li><strong>Actions effectuées :</strong> historique des validations et modifications</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Finalités du traitement</h2>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Vos données sont utilisées pour :</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li><strong>Mise en relation :</strong> connecter clients et déménageurs</li>
                    <li><strong>Gestion des devis :</strong> transmission et suivi des demandes</li>
                    <li><strong>Paiement sécurisé :</strong> traitement des transactions avec séquestre</li>
                    <li><strong>Vérification :</strong> validation des documents professionnels des déménageurs</li>
                    <li><strong>Sécurité :</strong> prévention de la fraude et des abus</li>
                    <li><strong>Communication :</strong> envoi d'emails transactionnels (confirmation, notifications)</li>
                    <li><strong>Amélioration du service :</strong> statistiques anonymisées</li>
                    <li><strong>Support client :</strong> assistance et résolution de litiges</li>
                    <li><strong>Obligations légales :</strong> conformité fiscale et comptable</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">4. Base légale du traitement</h2>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Exécution du contrat :</strong> nécessaire pour fournir nos services de mise en relation
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Consentement :</strong> pour l'envoi d'emails marketing (optionnel, révocable)
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Obligation légale :</strong> conservation des factures, lutte anti-fraude
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Intérêt légitime :</strong> amélioration du service, prévention des abus
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Destinataires des données</h2>

              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Accès aux données :</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li><strong>Personnel autorisé :</strong> équipe TrouveTonDemenageur (accès restreint)</li>
                    <li><strong>Déménageurs vérifiés :</strong> accès aux demandes de devis (données anonymisées jusqu'à acceptation)</li>
                    <li><strong>Prestataires techniques :</strong>
                      <ul className="list-circle list-inside ml-6 mt-1">
                        <li>Supabase (hébergement sécurisé UE)</li>
                        <li>Stripe (paiements sécurisés)</li>
                        <li>Resend (envoi d'emails transactionnels)</li>
                        <li>OpenAI (vérification de documents via IA)</li>
                        <li>Google Maps (calcul de distance)</li>
                      </ul>
                    </li>
                    <li><strong>Autorités :</strong> sur réquisition judiciaire uniquement</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <p className="font-semibold text-orange-900 mb-2">Protection de la confidentialité</p>
                  <p className="text-gray-700">
                    Les coordonnées complètes du client ne sont transmises au déménageur qu'après acceptation
                    du devis par le client et paiement effectué. Avant cela, le déménageur ne voit que des
                    informations anonymisées.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Durée de conservation</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type de données</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Compte actif (client/déménageur)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Durée d'utilisation + 3 ans</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Devis et missions</td>
                      <td className="px-6 py-4 text-sm text-gray-700">10 ans (obligation comptable)</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Factures et paiements</td>
                      <td className="px-6 py-4 text-sm text-gray-700">10 ans (obligation fiscale)</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Documents déménageurs (KBIS, RC Pro)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">5 ans après fin de collaboration</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Logs de connexion</td>
                      <td className="px-6 py-4 text-sm text-gray-700">1 an</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-700">Photos et inventaires</td>
                      <td className="px-6 py-4 text-sm text-gray-700">3 ans après mission</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">7. Vos droits</h2>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-6">
                <p className="font-semibold text-green-900 mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit de rectification :</strong> corriger des données inexactes
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit à l'effacement :</strong> supprimer vos données (sauf obligations légales)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit à la limitation :</strong> limiter le traitement de vos données
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit d'opposition :</strong> vous opposer à certains traitements
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">✓</span>
                    <div>
                      <strong>Droit de retirer votre consentement :</strong> pour les emails marketing
                    </div>
                  </li>
                </ul>

                <div className="bg-white p-4 rounded-lg mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Pour exercer vos droits :</p>
                  <p className="text-gray-700">Email : <strong>dpo@trouvetondemenageur.fr</strong></p>
                  <p className="text-gray-700 text-sm mt-2">Réponse sous 1 mois maximum</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold text-gray-900 mb-2">Droit de réclamation</p>
                <p className="text-gray-700">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
                  auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>CNIL</strong> - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
                  Tél : 01 53 73 22 22 - Site : www.cnil.fr
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Sécurité des données</h2>

              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-semibold text-blue-900 mb-3">Mesures de sécurité mises en œuvre :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>Hébergement sécurisé dans l'Union Européenne (conformité RGPD)</li>
                  <li>Authentification forte avec vérification d'email</li>
                  <li>Contrôle d'accès strict au panel d'administration</li>
                  <li>Sauvegardes quotidiennes automatiques</li>
                  <li>Politique de mots de passe robustes</li>
                  <li>Surveillance et détection des activités suspectes</li>
                  <li>Paiements sécurisés via Stripe (certifié PCI-DSS niveau 1)</li>
                  <li>Nous ne stockons jamais vos données bancaires complètes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Cookies essentiels (obligatoires)</h3>
                  <p className="text-gray-700">
                    Cookies d'authentification et de session, nécessaires au fonctionnement de la plateforme.
                    Ils ne peuvent pas être désactivés.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Cookies analytiques (optionnels)</h3>
                  <p className="text-gray-700">
                    Statistiques anonymisées de fréquentation. Vous pouvez les refuser via notre bandeau cookies.
                  </p>
                </div>

                <p className="text-gray-700 text-sm">
                  Nous n'utilisons <strong>aucun cookie publicitaire ou de tracking tiers</strong>.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Transferts internationaux</h2>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                <p className="text-gray-700">
                  Certains de nos prestataires (Stripe, OpenAI) peuvent être situés hors de l'Union Européenne.
                  Ces transferts sont encadrés par :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                  <li>Clauses contractuelles types de la Commission Européenne</li>
                  <li>Certification Privacy Shield (pour les entreprises américaines)</li>
                  <li>Garanties de sécurité équivalentes au RGPD</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications</h2>
              <p className="text-gray-700">
                Cette politique de confidentialité peut être mise à jour. Nous vous informerons de toute modification
                importante par email et/ou notification sur la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-semibold text-blue-900 mb-3">
                  Pour toute question sur la protection de vos données personnelles :
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Délégué à la Protection des Données (DPO) :</strong></p>
                  <p>Email : <strong className="text-blue-600">dpo@trouvetondemenageur.fr</strong></p>
                  <p>Contact général : <strong className="text-blue-600">contact@trouvetondemenageur.fr</strong></p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
