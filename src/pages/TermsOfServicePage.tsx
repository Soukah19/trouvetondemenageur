import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function TermsOfServicePage() {
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
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d'Utilisation (CGU)</h1>
              <p className="text-gray-600">Dernière mise à jour : 25 janvier 2026</p>
            </div>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objet et acceptation</h2>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-4">
                <p className="text-gray-700 mb-3">
                  Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme
                  <strong> TrouveTonDemenageur</strong>, accessible à l'adresse [URL à compléter].
                </p>
                <p className="text-gray-700 font-semibold">
                  L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-orange-900 mb-2">RAPPEL IMPORTANT</p>
                    <p className="text-gray-700">
                      TrouveTonDemenageur est une <strong>plateforme de mise en relation uniquement</strong>.
                      Nous ne sommes pas déménageurs, ne réalisons aucune prestation de déménagement, et
                      n'intervenons pas directement sur le terrain.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Définitions</h2>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Plateforme :</strong> désigne le site web et l'application TrouveTonDemenageur</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Client :</strong> personne physique ou morale recherchant un service de déménagement</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Déménageur :</strong> professionnel du déménagement inscrit et vérifié sur la plateforme</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Utilisateur :</strong> toute personne utilisant la plateforme (client, déménageur, visiteur)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Devis :</strong> proposition commerciale soumise par un déménageur à un client</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong className="text-blue-600">Mission :</strong> prestation de déménagement acceptée et confirmée entre un client et un déménageur</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Description des services</h2>

              <p className="text-gray-700 mb-4">
                TrouveTonDemenageur met à disposition une plateforme numérique permettant :
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="border-l-4 border-green-500 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Pour les Clients</h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Publier une demande de devis</li>
                        <li>• Recevoir et comparer des devis</li>
                        <li>• Consulter les profils vérifiés</li>
                        <li>• Effectuer un paiement sécurisé</li>
                        <li>• Suivre sa mission en temps réel</li>
                        <li>• Laisser un avis après la mission</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Pour les Déménageurs</h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Consulter les demandes de devis</li>
                        <li>• Soumettre des propositions</li>
                        <li>• Gérer leur calendrier</li>
                        <li>• Recevoir des paiements sécurisés</li>
                        <li>• Gérer leur profil et portfolio</li>
                        <li>• Obtenir des avis clients</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-red-900 mb-2">CE QUE NOUS NE FAISONS PAS</p>
                    <ul className="text-gray-700 space-y-1">
                      <li>✗ Nous ne réalisons pas de déménagements</li>
                      <li>✗ Nous ne sommes pas employeurs des déménageurs</li>
                      <li>✗ Nous ne transportons pas vos biens</li>
                      <li>✗ Nous ne sommes pas responsables des dommages sur le terrain</li>
                      <li>✗ Nous n'intervenons pas physiquement lors des missions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Inscription et compte utilisateur</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">4.1 Conditions d'inscription</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Être majeur (18 ans minimum)</li>
                    <li>Fournir des informations exactes et à jour</li>
                    <li>Disposer d'une adresse email valide</li>
                    <li>Accepter les présentes CGU</li>
                    <li>Pour les déménageurs : disposer d'un KBIS et RC Pro valides</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">4.2 Vérification des déménageurs</h3>
                  <p className="text-gray-700 mb-2">
                    Les déménageurs doivent obligatoirement fournir et maintenir à jour :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Extrait KBIS de moins de 3 mois</li>
                    <li>Attestation de Responsabilité Civile Professionnelle (RC Pro) valide</li>
                    <li>Assurance véhicule en cours de validité</li>
                    <li>Permis de conduire valide</li>
                    <li>Carte grise du véhicule</li>
                    <li>Attestation Urssaf et/ou MSA à jour</li>
                  </ul>
                  <p className="text-gray-700 mt-2 text-sm">
                    <strong>Important :</strong> L'accès aux devis est suspendu automatiquement si un document expire.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">4.3 Sécurité du compte</h3>
                  <p className="text-gray-700">
                    Vous êtes responsable de la confidentialité de vos identifiants. Toute activité effectuée
                    depuis votre compte est présumée avoir été effectuée par vous.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Obligations des utilisateurs</h2>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">5.1 Obligations communes</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Respecter les lois en vigueur</li>
                    <li>Fournir des informations exactes et sincères</li>
                    <li>Ne pas usurper l'identité d'autrui</li>
                    <li>Ne pas diffuser de contenu illégal, diffamatoire ou inapproprié</li>
                    <li>Respecter les autres utilisateurs</li>
                    <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
                    <li>Ne pas tenter de contourner les systèmes de sécurité</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900 mb-2">5.2 Obligations spécifiques des Clients</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Décrire précisément les besoins du déménagement</li>
                    <li>Fournir des informations exactes (adresses, volume, étage, etc.)</li>
                    <li>Respecter les engagements pris envers le déménageur choisi</li>
                    <li>Effectuer le paiement dans les délais convenus</li>
                    <li>Être présent aux dates et horaires convenus</li>
                    <li>Laisser un avis honnête et constructif après la mission</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 bg-purple-50 p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">5.3 Obligations spécifiques des Déménageurs</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Être un professionnel légalement déclaré</li>
                    <li>Maintenir à jour tous les documents obligatoires</li>
                    <li>Disposer d'assurances professionnelles valides</li>
                    <li>Soumettre des devis sérieux et réalistes</li>
                    <li>Respecter les engagements pris envers le client</li>
                    <li>Réaliser les prestations avec professionnalisme</li>
                    <li>Respecter les biens confiés</li>
                    <li>Informer rapidement en cas d'imprévu</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Fonctionnement de la plateforme</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.1 Publication d'une demande de devis</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Le client crée un compte et publie sa demande</li>
                    <li>Les déménageurs vérifiés reçoivent une notification</li>
                    <li>Les coordonnées complètes restent masquées jusqu'à acceptation d'un devis</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.2 Soumission de devis</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Les déménageurs consultent les demandes dans leurs zones d'intervention</li>
                    <li>Ils soumettent un devis détaillé avec prix et date proposée</li>
                    <li>Le client reçoit et compare les différents devis</li>
                    <li>Les devis sont valables 15 jours par défaut</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.3 Acceptation et paiement</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Le client accepte un devis et procède au paiement sécurisé</li>
                    <li>Les fonds sont placés en séquestre (non versés immédiatement au déménageur)</li>
                    <li>Les coordonnées complètes sont échangées entre les parties</li>
                    <li>La mission est officiellement créée</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.4 Réalisation et validation</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Le déménageur réalise la prestation à la date convenue</li>
                    <li>Le client valide la bonne exécution de la mission</li>
                    <li>Le paiement est libéré au déménageur conformément aux conditions tarifaires convenues</li>
                    <li>Les deux parties peuvent laisser un avis</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Responsabilité et garanties</h2>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-4">
                <h3 className="font-semibold text-red-900 mb-3">7.1 LIMITATION DE RESPONSABILITÉ DE LA PLATEFORME</h3>
                <p className="text-gray-700 mb-3">
                  <strong>TrouveTonDemenageur, agissant uniquement en qualité d'intermédiaire technique, ne saurait en aucun cas être tenu responsable :</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>De la qualité, de l'exécution ou du résultat</strong> des prestations réalisées par les déménageurs</li>
                  <li><strong>Des dommages de toute nature</strong> causés aux biens durant toute phase du déménagement</li>
                  <li><strong>Des retards, absences, annulations ou manquements</strong> de quelque nature que ce soit du fait des déménageurs</li>
                  <li><strong>Des litiges, différends ou conflits</strong> entre clients et déménageurs</li>
                  <li><strong>De l'exactitude, de la véracité ou de la complétude</strong> des informations fournies par les utilisateurs</li>
                  <li><strong>Des manquements</strong> aux obligations légales, réglementaires ou contractuelles des déménageurs</li>
                  <li><strong>Des accidents, incidents ou dommages corporels</strong> survenus durant ou en lien avec la prestation</li>
                  <li><strong>Des pertes financières, commerciales ou d'exploitation</strong> résultant de l'utilisation de la plateforme</li>
                  <li><strong>De tout préjudice direct ou indirect</strong> subi par les utilisateurs</li>
                </ul>
                <p className="text-gray-700 mt-4 font-semibold">
                  Les déménageurs sont des professionnels totalement indépendants. Le contrat de prestation est conclu
                  exclusivement et directement entre le client et le déménageur, sans aucune intervention de TrouveTonDemenageur
                  dans les termes, l'exécution ou les conséquences de celui-ci.
                </p>
                <p className="text-gray-700 mt-3 font-semibold">
                  En aucun cas TrouveTonDemenageur ne pourra être considéré comme cocontractant, garant ou responsable
                  des obligations contractuelles du déménageur.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 p-6">
                <h3 className="font-semibold text-green-900 mb-3">7.2 SERVICES TECHNIQUES FOURNIS PAR LA PLATEFORME</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Dans le cadre strict de son rôle d'intermédiaire technique, TrouveTonDemenageur met à disposition :</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Un système de vérification</strong> des documents fournis par les déménageurs, sans garantie quant à leur validité</li>
                  <li><strong>Une infrastructure de paiement</strong> sécurisée via des prestataires tiers</li>
                  <li><strong>Des outils</strong> de notation et d'évaluation</li>
                  <li><strong>Un support technique</strong> pour l'utilisation de la plateforme</li>
                  <li><strong>Des fonctionnalités</strong> de communication entre utilisateurs</li>
                </ul>
                <p className="text-gray-700 mt-3 text-sm italic">
                  Ces services sont fournis à titre informatif et technique uniquement, sans garantie de résultat.
                  La plateforme ne garantit pas l'absence d'erreurs, de dysfonctionnements ou d'interruptions.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mt-4">
                <h3 className="font-semibold text-orange-900 mb-2">7.3 Responsabilité des déménageurs</h3>
                <p className="text-gray-700">
                  Les déménageurs sont seuls responsables de :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                  <li>La bonne exécution de leurs prestations</li>
                  <li>La protection des biens qui leur sont confiés</li>
                  <li>Le respect des délais et engagements pris</li>
                  <li>La souscription et le maintien de leurs assurances professionnelles</li>
                  <li>Le respect de la réglementation du secteur du déménagement</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Gestion des litiges</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">8.1 Déclaration d'un problème</h3>
                  <p className="text-gray-700 mb-2">
                    En cas de problème durant ou après la mission :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                    <li>Contacter le déménageur directement via la messagerie</li>
                    <li>Si aucune solution, signaler le problème à notre support</li>
                    <li>Fournir tous les éléments (photos, descriptions, échanges)</li>
                    <li>Notre équipe étudiera le dossier sous 48h</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">8.2 Système de déclaration de dommages</h3>
                  <p className="text-gray-700">
                    Les clients disposent d'un délai de <strong>48h après la fin de la mission</strong> pour
                    déclarer des dommages constatés. Photos et descriptions détaillées sont requises.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">8.3 Médiation</h3>
                  <p className="text-gray-700">
                    TrouveTonDemenageur peut proposer une médiation gratuite pour faciliter la résolution
                    amiable des litiges. Notre rôle est de faciliter le dialogue, pas de trancher juridiquement.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">8.4 Remboursements exceptionnels</h3>
                  <p className="text-gray-700">
                    Dans des cas graves et avérés (absence du déménageur, abandon de mission, fraude),
                    TrouveTonDemenageur peut décider d'un remboursement total ou partiel, après étude du dossier.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Interdictions</h2>

              <div className="bg-red-50 border-l-4 border-red-600 p-6">
                <p className="font-semibold text-red-900 mb-3">Il est strictement interdit de :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Contourner la plateforme ou ses conditions d'utilisation</li>
                  <li>Utiliser la plateforme à des fins frauduleuses</li>
                  <li>Publier de fausses annonces ou de faux avis</li>
                  <li>Usurper l'identité d'un autre utilisateur</li>
                  <li>Harceler, menacer ou insulter d'autres utilisateurs</li>
                  <li>Diffuser des contenus illégaux ou inappropriés</li>
                  <li>Tenter de pirater ou compromettre la sécurité de la plateforme</li>
                  <li>Extraire ou copier les données de la plateforme (scraping)</li>
                  <li>Utiliser des robots ou scripts automatisés</li>
                </ul>
                <p className="text-gray-700 mt-4 font-semibold">
                  Toute violation peut entraîner la suspension ou la suppression immédiate du compte,
                  sans préavis ni remboursement, ainsi que d'éventuelles poursuites judiciaires.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Suspension et résiliation</h2>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">10.1 Par l'utilisateur</h3>
                  <p className="text-gray-700">
                    Vous pouvez supprimer votre compte à tout moment depuis vos paramètres ou en contactant
                    notre support. Les missions en cours devront être honorées.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">10.2 Par la plateforme</h3>
                  <p className="text-gray-700 mb-2">
                    TrouveTonDemenageur se réserve le droit de suspendre ou supprimer un compte en cas de :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Violation des présentes CGU</li>
                    <li>Comportement frauduleux ou abusif</li>
                    <li>Non-respect des obligations contractuelles répété</li>
                    <li>Avis ou notes manifestement injustifiés</li>
                    <li>Documents expirés ou invalides (déménageurs)</li>
                    <li>Activité suspecte ou illégale</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Propriété intellectuelle</h2>
              <p className="text-gray-700">
                Tous les éléments de la plateforme (design, logos, textes, code source, bases de données)
                sont protégés par le droit d'auteur et appartiennent à TrouveTonDemenageur.
              </p>
              <p className="text-gray-700 mt-3">
                Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Modifications des CGU</h2>
              <p className="text-gray-700">
                TrouveTonDemenageur se réserve le droit de modifier les présentes CGU à tout moment.
                Les utilisateurs seront informés par email des modifications importantes.
              </p>
              <p className="text-gray-700 mt-3">
                La poursuite de l'utilisation après modification vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Droit applicable et juridiction</h2>
              <p className="text-gray-700">
                Les présentes CGU sont régies par le droit français. En cas de litige, et après échec de
                toute tentative de recherche d'une solution amiable, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-semibold text-blue-900 mb-3">
                  Pour toute question concernant les présentes CGU :
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>Email : <strong className="text-blue-600">contact@trouvetondemenageur.fr</strong></p>
                  <p>Support : <strong className="text-blue-600">support@trouvetondemenageur.fr</strong></p>
                  <p>Juridique : <strong className="text-blue-600">legal@trouvetondemenageur.fr</strong></p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
