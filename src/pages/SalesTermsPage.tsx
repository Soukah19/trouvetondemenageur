import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, AlertCircle, Shield } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function SalesTermsPage() {
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
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conditions Générales de Vente (CGV)</h1>
              <p className="text-gray-600">Dernière mise à jour : 25 janvier 2026</p>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-orange-900 mb-2">RAPPEL ESSENTIEL</p>
                <p className="text-gray-700">
                  <strong>TrouveTonDemenageur est une plateforme de mise en relation UNIQUEMENT.</strong>
                  Nous ne vendons pas de services de déménagement. Nous facilitons la connexion entre clients
                  et déménageurs professionnels indépendants. Les prestations de déménagement sont vendues et
                  réalisées directement par les déménageurs.
                </p>
              </div>
            </div>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objet et champ d'application</h2>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                <p className="text-gray-700 mb-3">
                  Les présentes Conditions Générales de Vente (CGV) s'appliquent à la <strong>commission de mise
                  en relation</strong> facturée par TrouveTonDemenageur aux déménageurs professionnels inscrits
                  sur la plateforme.
                </p>
                <p className="text-gray-700 font-semibold">
                  Ces CGV ne régissent PAS le contrat de prestation de déménagement entre le client et le
                  déménageur, qui relève de la responsabilité exclusive du déménageur.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Services fournis par TrouveTonDemenageur</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">2.1 Service de mise en relation</h3>
                  <p className="text-gray-700 mb-2">
                    TrouveTonDemenageur fournit un service numérique de mise en relation comprenant :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Accès à une plateforme web et mobile</li>
                    <li>Diffusion des demandes de devis aux déménageurs vérifiés</li>
                    <li>Système de comparaison de devis pour les clients</li>
                    <li>Infrastructure de paiement sécurisé avec séquestre</li>
                    <li>Vérification des documents professionnels obligatoires</li>
                    <li>Système de notation et d'avis vérifiés</li>
                    <li>Messagerie sécurisée entre clients et déménageurs</li>
                    <li>Support client et assistance en cas de litige</li>
                    <li>Outils de gestion de calendrier et de missions</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4">
                  <h3 className="font-semibold text-red-900 mb-2">2.2 Services NON fournis</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Aucune prestation de déménagement physique</li>
                    <li>Aucun transport de biens ou de mobilier</li>
                    <li>Aucune intervention sur le terrain</li>
                    <li>Aucune manutention ou emballage</li>
                    <li>Aucune location de véhicules ou d'équipements</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Tarifs et commission</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">3.1 Pour les Clients</h3>
                  <p className="text-gray-700">
                    <strong>L'utilisation de la plateforme est gratuite pour les clients.</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                    <li>Aucun frais d'inscription</li>
                    <li>Aucun frais de publication de demande de devis</li>
                    <li>Le prix payé par le client correspond au prix proposé par le déménageur</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">3.2 Pour les Déménageurs : Frais de service</h3>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-700 mb-2">
                        <strong>Frais de service :</strong> La plateforme prélève des frais de service sur les missions réalisées
                      </p>
                      <p className="text-gray-700 text-sm">
                        Le montant exact des frais de service est communiqué individuellement aux déménageurs
                        lors de leur inscription et acceptation sur la plateforme.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-700 mb-2">
                        <strong>Modalités de prélèvement :</strong>
                      </p>
                      <p className="text-gray-700 text-sm">
                        Les frais sont automatiquement déduits lors du versement des fonds au déménageur,
                        après validation de la mission par le client.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-700 mb-2">
                        <strong>Application des frais :</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                        <li>Frais applicables sur les missions réalisées et validées</li>
                        <li>Aucuns frais sur les devis non acceptés</li>
                        <li>Aucuns frais en cas d'annulation avant prestation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">3.3 Transparence tarifaire</h3>
                  <p className="text-gray-700">
                    Les conditions tarifaires sont communiquées clairement lors de l'inscription.
                    Aucuns frais supplémentaires ne sont appliqués au-delà des conditions convenues.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Processus de paiement et séquestre</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">4.1 Paiement par le client</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Le client accepte un devis sur la plateforme</li>
                    <li>Le client effectue le paiement sécurisé via Stripe</li>
                    <li>Les moyens de paiement acceptés : CB, Visa, Mastercard</li>
                    <li>Le paiement est immédiatement sécurisé</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">4.2 Système de séquestre (escrow)</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>Protection des deux parties :</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Client :</strong> les fonds sont bloqués jusqu'à validation de la mission</li>
                    <li><strong>Déménageur :</strong> paiement garanti dès acceptation du devis</li>
                    <li>Les fonds sont conservés de manière sécurisée par Stripe</li>
                    <li>Ni le client ni le déménageur ne peuvent les retirer pendant la mission</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">4.3 Libération du paiement</h3>
                  <p className="text-gray-700 mb-2">Le paiement est libéré au déménageur quand :</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Le client valide manuellement la bonne exécution de la mission, OU</li>
                    <li>Automatiquement après 7 jours suivant la date de déménagement prévue (si aucune réclamation)</li>
                  </ul>
                  <p className="text-gray-700 mt-3 text-sm">
                    Le montant versé correspond au prix facturé diminué des frais de service applicables et des frais de traitement de paiement.
                  </p>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">4.4 Blocage du paiement</h3>
                  <p className="text-gray-700">
                    Le paiement peut être bloqué temporairement si :
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700 ml-4">
                    <li>Le client déclare un dommage dans les 48h suivant la mission</li>
                    <li>Un litige est ouvert et en cours d'examen</li>
                    <li>Des preuves de non-exécution sont apportées</li>
                  </ul>
                  <p className="text-gray-700 mt-2 text-sm">
                    Le paiement sera libéré ou remboursé après examen du litige par notre équipe.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contrat de prestation de déménagement</h2>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-4">
                <p className="font-semibold text-red-900 mb-3">IMPORTANT : Relation directe et exclusive Client-Déménageur</p>
                <p className="text-gray-700 mb-3">
                  <strong>Le contrat de prestation de déménagement est conclu EXCLUSIVEMENT et DIRECTEMENT entre le client et
                  le déménageur.</strong> TrouveTonDemenageur n'est en AUCUN CAS partie à ce contrat et n'intervient pas dans
                  son exécution, ses termes ou ses conséquences.
                </p>
                <p className="text-gray-700 mb-2 font-semibold">
                  Le déménageur est SEUL ET ENTIÈREMENT responsable de :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                  <li>La bonne exécution et le résultat de sa prestation</li>
                  <li>Le respect des délais convenus</li>
                  <li>La protection, la sécurité et l'intégrité des biens transportés</li>
                  <li>Tous dommages, pertes ou détériorations causés durant toute phase de la mission</li>
                  <li>Le respect de la réglementation applicable au transport et au déménagement</li>
                  <li>La fourniture de tous documents légaux requis (devis, facture, contrat, lettre de voiture)</li>
                  <li>Tout manquement à ses obligations contractuelles ou légales</li>
                </ul>
                <p className="text-gray-700 mt-3 font-semibold">
                  TrouveTonDemenageur décline toute responsabilité concernant l'exécution du contrat de déménagement.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">5.1 Documents fournis par le déménageur</h3>
                <p className="text-gray-700 mb-2">
                  Le déménageur doit fournir au client :
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Un devis détaillé conforme à la réglementation</li>
                  <li>Une lettre de voiture (document de transport)</li>
                  <li>Une facture après exécution de la prestation</li>
                  <li>Une copie de son assurance RC Professionnelle</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Annulation et remboursement</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.1 Annulation par le client</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <p className="text-gray-700">
                        <strong>Plus de 7 jours avant :</strong> Remboursement intégral (100%)
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                      <p className="text-gray-700">
                        <strong>Entre 3 et 7 jours avant :</strong> Remboursement de 50%
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-red-500">
                      <p className="text-gray-700">
                        <strong>Moins de 3 jours avant :</strong> Aucun remboursement (sauf accord du déménageur)
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-3">
                    Les délais sont calculés en jours calendaires avant la date de déménagement prévue.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.2 Annulation par le déménageur</h3>
                  <p className="text-gray-700 mb-2">
                    Si le déménageur annule la mission après acceptation :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Client :</strong> remboursement intégral immédiat (100%)</li>
                    <li><strong>Déménageur :</strong> peut être sanctionné (suspension, exclusion)</li>
                    <li>Notation négative automatique pour le déménageur</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">6.3 Cas de force majeure</h3>
                  <p className="text-gray-700">
                    En cas de force majeure (intempéries graves, catastrophe naturelle, grève générale) :
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700 ml-4">
                    <li>Report de la mission sans frais</li>
                    <li>Ou remboursement intégral si report impossible</li>
                    <li>Aucune pénalité pour les deux parties</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">6.4 Délai de remboursement</h3>
                  <p className="text-gray-700">
                    Les remboursements sont effectués sous <strong>5 à 10 jours ouvrés</strong> sur le moyen
                    de paiement utilisé lors de la transaction.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">7. Garanties et assurances</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6">
                  <h3 className="font-semibold text-orange-900 mb-2">7.1 Assurance du déménageur</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>Chaque déménageur DOIT obligatoirement disposer de :</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>RC Professionnelle :</strong> couvre les dommages causés aux biens du client</li>
                    <li><strong>Assurance véhicule :</strong> assurance transport de marchandises</li>
                    <li>Documents vérifiés et validés par TrouveTonDemenageur</li>
                  </ul>
                  <p className="text-gray-700 mt-3 font-semibold">
                    En cas de dommage, c'est l'assurance du déménageur qui indemnise le client,
                    PAS TrouveTonDemenageur.
                  </p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4">
                  <h3 className="font-semibold text-red-900 mb-2">7.2 Limitation stricte de responsabilité de TrouveTonDemenageur</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>TrouveTonDemenageur, en sa qualité d'intermédiaire technique, ne saurait en AUCUN CAS être tenu responsable :</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700 ml-4">
                    <li>Des dommages matériels, immatériels ou corporels de toute nature</li>
                    <li>Des retards, absences, annulations ou manquements du déménageur</li>
                    <li>De la qualité, de l'exécution ou du résultat de la prestation réalisée</li>
                    <li>Des litiges relatifs au prix, aux conditions ou aux prestations</li>
                    <li>De tout préjudice financier, commercial ou d'exploitation</li>
                    <li>De l'inexécution ou de la mauvaise exécution du contrat de déménagement</li>
                  </ul>
                  <p className="text-gray-700 mt-3 font-semibold">
                    La responsabilité de TrouveTonDemenageur est strictement limitée à la fourniture de l'outil technique de mise en relation.
                    En aucun cas la plateforme ne peut être considérée comme fournisseur de services de déménagement ou garant des prestations.
                  </p>
                  <p className="text-gray-700 mt-2 text-sm italic">
                    Dans l'hypothèse où la responsabilité de TrouveTonDemenageur serait retenue, celle-ci serait limitée au montant des frais
                    de service effectivement perçus pour la transaction concernée, à l'exclusion de tout autre préjudice.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <h3 className="font-semibold text-green-900 mb-2">7.3 Services techniques mis à disposition</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>Dans le cadre de son rôle d'intermédiaire, la plateforme propose :</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Un système de vérification des documents fournis (sans garantie quant à leur validité)</li>
                    <li>Une infrastructure de paiement sécurisée via des prestataires tiers</li>
                    <li>Un support technique pour l'utilisation de la plateforme</li>
                    <li>Des outils de gestion et de communication</li>
                  </ul>
                  <p className="text-gray-700 text-sm italic mt-2">
                    Ces services sont fournis en l'état, sans garantie de résultat ou d'absence d'interruption.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Facturation</h2>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">8.1 Pour les clients</h3>
                  <p className="text-gray-700">
                    Le client reçoit une facture TTC émise par <strong>le déménageur</strong> (pas par
                    TrouveTonDemenageur) pour la prestation de déménagement.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">8.2 Pour les déménageurs</h3>
                  <p className="text-gray-700">
                    TrouveTonDemenageur émet une facture HT pour les frais de service de mise en relation.
                    Cette facture est accessible dans l'espace déménageur.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Réclamations</h2>

              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-3">
                  <strong>Vous avez un problème ? Voici la marche à suivre :</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    <strong>Problème avec la prestation :</strong> contactez directement le déménageur
                    puis son assurance si dommage matériel
                  </li>
                  <li>
                    <strong>Problème avec le paiement ou la plateforme :</strong> contactez notre support
                    à support@trouvetondemenageur.fr
                  </li>
                  <li>
                    <strong>Litige non résolu :</strong> notre équipe étudiera votre dossier et proposera
                    une médiation gratuite
                  </li>
                  <li>
                    <strong>Délai de réponse :</strong> nous nous engageons à répondre sous 48h ouvrées
                  </li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Médiation et règlement des litiges</h2>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">10.1 Médiation interne</h3>
                  <p className="text-gray-700">
                    En cas de litige, TrouveTonDemenageur propose une médiation gratuite pour faciliter
                    le dialogue entre client et déménageur.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">10.2 Médiation de la consommation</h3>
                  <p className="text-gray-700">
                    Conformément à l'article L.612-1 du Code de la consommation, vous pouvez recourir
                    gratuitement à un médiateur de la consommation :
                  </p>
                  <div className="mt-2 bg-white p-3 rounded">
                    <p className="text-gray-700 text-sm">
                      <strong>Médiateur :</strong> [À compléter - ex: Médiateur de la consommation CNPM]<br />
                      <strong>Site :</strong> [URL à compléter]
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">10.3 Juridiction compétente</h3>
                  <p className="text-gray-700">
                    En cas d'échec de la médiation, les tribunaux français seront compétents. Le droit
                    français s'applique.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Données personnelles</h2>
              <p className="text-gray-700">
                Le traitement de vos données personnelles est décrit dans notre{' '}
                <Link to="/legal/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                  Politique de Confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Modifications des CGV</h2>
              <p className="text-gray-700">
                TrouveTonDemenageur se réserve le droit de modifier les présentes CGV. Les utilisateurs
                seront informés par email de toute modification importante. La poursuite de l'utilisation
                après modification vaut acceptation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-semibold text-blue-900 mb-3">
                  Pour toute question concernant les présentes CGV :
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>Support : <strong className="text-blue-600">support@trouvetondemenageur.fr</strong></p>
                  <p>Facturation : <strong className="text-blue-600">facturation@trouvetondemenageur.fr</strong></p>
                  <p>Réclamations : <strong className="text-blue-600">reclamations@trouvetondemenageur.fr</strong></p>
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
