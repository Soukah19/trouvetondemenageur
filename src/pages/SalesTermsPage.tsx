import { ArrowLeft, ChevronDown, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Section = {
  title: string;
  content: React.ReactNode;
  category: string;
};

export default function SalesTermsPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections: Section[] = [
    {
      category: 'definitions',
      title: 'Article 1 – Définitions et Champ d\'Application',
      content: (
        <>
          <p className="mb-3">Les présentes Conditions Générales (ci-après « CG ») régissent l&apos;intégralité des relations contractuelles entre la société TROUVE TON DÉMÉNAGEUR (ci-après « TTD »), SASU au capital de 1 000 €, dont le siège social est situé au 60 rue François 1er, 75008 Paris, immatriculée au RCS de Paris sous le n° 101 378 248, et toute personne physique ou morale utilisant la plateforme (ci-après « le Client »).</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 mt-3">
            <p><strong>Plateforme :</strong> Ensemble des outils numériques, algorithmes et services accessibles sur www.trouvetondemenageur.fr.</p>
            <p><strong>Déménageur / Prestataire :</strong> Professionnel indépendant du transport de marchandises et du déménagement, dûment inscrit au Registre des Transporteurs, tiers à TTD. Le Déménageur garantit être inscrit au registre des transporteurs routiers conformément à la réglementation applicable.</p>
            <p><strong>Intermédiation :</strong> Service de mise en relation technique et fourniture d&apos;outils de sécurisation (IA, Signature électronique et outils numériques de sécurisation).</p>
            <p><strong>Contrat de Transport :</strong> Contrat de prestation de services conclu exclusivement et directement entre le Client et le Déménageur.</p>
          </div>
        </>
      ),
    },
    {
      category: 'intermediaire',
      title: 'Article 2 – Statut d\'Intermédiaire et Neutralité Opérationnelle',
      content: (
        <>
          <p className="mb-3"><strong>2.1. Nature technique du service :</strong> TTD agit exclusivement en qualité d&apos;éditeur d&apos;une plateforme d&apos;intermédiation en ligne au sens de l&apos;article L. 111-7 du Code de la consommation. Son rôle se limite à la mise en relation technique entre un besoin de transport et une offre professionnelle.</p>
          <p className="mb-3 text-sm text-gray-600">Les modalités de référencement et de classement des Déménageurs sur la plateforme reposent notamment sur des critères techniques tels que la disponibilité, la zone géographique, la complétude du profil et l&apos;historique d&apos;activité sur la plateforme.</p>
          <p className="mb-3"><strong>2.2. Absence de maîtrise de la prestation :</strong> Le Client reconnaît expressément que TTD n&apos;exerce aucune des prérogatives caractéristiques d&apos;un transporteur ou d&apos;un commissionnaire de transport. Notamment :</p>
          <ul className="space-y-1 ml-4 mb-3 list-none">
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>TTD ne possède, ne loue, ni ne gère aucun véhicule de transport.</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>TTD n&apos;intervient pas dans l&apos;organisation du transport (choix des itinéraires, horaires de passage, affectation du personnel).</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>TTD n&apos;exerce aucune autorité ni lien de subordination sur les Déménageurs.</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>Les tarifs sont librement fixés par les Prestataires sur la base de leur propre structure de coûts.</li>
          </ul>
          <p className="mb-3 text-sm text-gray-600">TTD procède à une vérification administrative des documents fournis par les déménageurs (extrait Kbis, assurances, inscription au registre des transporteurs). Cette vérification ne constitue pas une garantie sur la qualité de l&apos;exécution de la prestation, laquelle relève exclusivement de la responsabilité du Déménageur.</p>
          <p className="mb-3"><strong>2.3. Exclusion de Responsabilité Matérielle :</strong> En sa qualité de tiers au Contrat de Transport, TTD ne saurait être tenue pour responsable des dommages matériels (casse, vol, perte), corporels, des retards de livraison ou de l&apos;inexécution de la prestation par le Déménageur. Seules les assurances Responsabilité Civile Professionnelle et Marchandises du Déménageur ont vocation à couvrir ces risques.</p>
          <p className="mb-3 text-sm text-gray-600">Chaque déménageur partenaire déclare disposer d&apos;une assurance responsabilité civile professionnelle et d&apos;une assurance transport de marchandises en cours de validité.</p>
          <p className="mb-3"><strong>2.4. Précisions sur le statut d&apos;intermédiaire :</strong> TTD agit exclusivement en qualité d&apos;intermédiaire technique de mise en relation. TTD ne participe en aucun cas à l&apos;organisation matérielle du déménagement, ne fixe pas les prix des prestations, ne donne aucune instruction opérationnelle au Déménageur et n&apos;exerce aucun pouvoir de direction ou de contrôle sur l&apos;exécution de la prestation. Le Déménageur demeure seul responsable de la planification, de l&apos;organisation, des moyens humains et matériels mobilisés et de l&apos;exécution du transport. Les parties reconnaissent expressément que TTD n&apos;a ni la qualité de transporteur ni celle de commissionnaire de transport au sens du Code des transports.</p>
          <p className="mb-3"><strong>2.5. Plafonnement de responsabilité :</strong> La responsabilité de TTD, toutes causes confondues, est strictement limitée au montant de la commission effectivement perçue par TTD au titre du dossier concerné. En aucun cas TTD ne pourra être tenue responsable des dommages indirects, immatériels ou consécutifs, notamment perte d&apos;exploitation, perte de chiffre d&apos;affaires, perte de chance ou atteinte à l&apos;image.</p>
          <p className="mb-3"><strong>2.6. Interdiction de contournement de la plateforme :</strong> Le Client s&apos;engage à ne pas contacter directement un Déménageur identifié via la plateforme dans le but de conclure une prestation en dehors de la plateforme. Toute tentative de contournement visant à éviter le paiement des frais de mise en relation constitue une violation des présentes CGV/CGU. TTD se réserve le droit de suspendre ou supprimer l&apos;accès au compte du Client en cas de contournement avéré. TTD se réserve également le droit de réclamer une indemnité correspondant aux frais de mise en relation normalement dus.</p>
          <p className="mb-3"><strong>2.7. Disponibilité de la plateforme :</strong> TTD s&apos;efforce d&apos;assurer un accès continu à la plateforme. Cependant, des interruptions temporaires peuvent survenir pour maintenance, mise à jour ou incident technique. TTD ne saurait être tenue responsable des conséquences d&apos;une indisponibilité temporaire du service.</p>
          <p className="mb-3"><strong>2.8. Utilisation loyale de la plateforme :</strong> Le Client s&apos;engage à utiliser la plateforme de manière loyale et conforme à sa finalité. Il est notamment interdit :</p>
          <ul className="space-y-1 ml-4 mb-3 list-none">
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>de fournir des informations fausses ou trompeuses lors de la demande de déménagement ;</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>d&apos;utiliser la plateforme dans un but frauduleux ou abusif ;</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>de créer plusieurs comptes utilisateurs dans le but de contourner les règles de la plateforme ;</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>de porter atteinte au bon fonctionnement technique de la plateforme.</li>
          </ul>
          <p className="text-sm text-gray-600">TTD se réserve le droit de suspendre ou supprimer tout compte utilisateur en cas de violation des présentes CGV/CGU. En cas de fraude manifeste ou d&apos;utilisation abusive de la plateforme, TTD pourra refuser toute nouvelle réservation et conserver les frais de réservation à titre d&apos;indemnité.</p>
        </>
      ),
    },
    {
      category: 'financier',
      title: 'Article 3 – Mécanisme Financier et Frais de Réservation',
      content: (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 space-y-3">
            <p><strong>Frais de réservation (30 %) :</strong> Lors de la validation de la réservation sur la plateforme, le Client règle des frais de réservation correspondant à la commission de mise en relation de la plateforme TROUVE TON DÉMÉNAGEUR. Ces frais correspondent à 30 % du montant du devis affiché et rémunèrent les services de mise en relation, de réservation du créneau et les outils numériques fournis par la plateforme.</p>
            <p><strong>Solde de la prestation (70 %) :</strong> Le solde correspondant au prix de la prestation de déménagement est réglé directement entre le Client et le Déménageur au moment de l&apos;exécution de la prestation. TTD n&apos;intervient pas dans ce paiement.</p>
          </div>
          <p className="text-sm text-gray-600">Les frais de réservation versés à la plateforme correspondent à des frais de mise en relation et ne constituent pas un acompte sur la prestation de déménagement.</p>
        </>
      ),
    },
    {
      category: 'preuve',
      title: 'Article 4 – Convention de Preuve et Protocole de Protection IA',
      content: (
        <>
          <p className="mb-3"><strong>4.1. Convention de Preuve Électronique :</strong> Conformément à l&apos;article 1365 du Code civil, les parties conviennent que les logs système, les données horodatées, les coordonnées GPS et les rapports d&apos;analyse générés par l&apos;Intelligence Artificielle de TTD constituent une preuve électronique recevable et opposable. Les enregistrements informatiques, journaux de connexion, horodatages, échanges électroniques, confirmations de paiement Stripe et données issues des systèmes d&apos;information de TTD constituent des éléments de preuve recevables entre les parties.</p>
          <p className="mb-3"><strong>4.2. Protocole Obligatoire :</strong> Pour bénéficier de l&apos;assistance de TTD dans le traitement d&apos;un éventuel litige, le Client s&apos;engage à :</p>
          <ul className="space-y-1 ml-4 mb-3 list-none">
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><strong>Avant chargement :</strong> Effectuer les clichés complets des biens via l&apos;interface TTD.</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><strong>Après livraison :</strong> Documenter tout dommage immédiat via le même outil.</li>
          </ul>
          <p><strong>4.3. Force Probante de l&apos;IA :</strong> Le « Rapport Technique de Constatation » généré par l&apos;IA de TTD, par comparaison des états numériques avant/après, constitue un commencement de preuve par écrit facilitant le règlement amiable ou l&apos;ouverture d&apos;un dossier de sinistre. TTD ne se substitue pas à un expert judiciaire mais fournit une base technique certifiée.</p>
        </>
      ),
    },
    {
      category: 'force_majeure',
      title: 'Article 5 – Force Majeure',
      content: (
        <>
          <p className="mb-3"><strong>5.1.</strong> TTD ne pourra être tenue responsable de tout retard ou inexécution résultant d&apos;un cas de force majeure au sens de l&apos;article 1218 du Code civil.</p>
          <p className="mb-3"><strong>5.2. Aléas logistiques :</strong> Les délais de transport peuvent être affectés par des circonstances indépendantes de la volonté du Déménageur telles que trafic routier, conditions météorologiques, restrictions de circulation, difficultés d&apos;accès ou événements imprévus. Ces circonstances ne pourront engager la responsabilité de TTD.</p>
          <p className="mb-3"><strong>5.3. Objets interdits :</strong> Le Client s&apos;engage à ne pas confier au Déménageur des objets dangereux, illégaux ou interdits au transport. Sont notamment exclus :</p>
          <ul className="space-y-1 ml-4 list-none">
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>matières inflammables</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>armes et munitions</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>substances dangereuses</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>produits illicites</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>espèces et objets de grande valeur non déclarés</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">Le Déménageur pourra refuser le transport de ces biens.</p>
        </>
      ),
    },
    {
      category: 'annulation',
      title: 'Article 6 – Droit de Rétractation et Annulation',
      content: (
        <>
          <p className="mb-3"><strong>6.1. Exclusion Légale :</strong> Conformément à l&apos;article L. 221-28 12° du Code de la consommation, le droit de rétractation de 14 jours ne peut être exercé pour les contrats de prestations de services de transport de biens qui doivent être fournis à une date ou à une période déterminée. La réservation étant ferme pour un créneau spécifique, le Client renonce à son droit de rétractation.</p>
          <p className="mb-3 font-semibold">6.2. Barème d&apos;Indemnisation Contractuelle (Annulation) :</p>
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 bg-green-50 rounded-lg p-3 text-sm">
              <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">✓</span>
              <span><strong>Annulation ≥ 14 jours avant la date :</strong> Remboursement des frais de réservation au Client (déduction faite des frais de transaction Stripe).</span>
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-3 text-sm">
              <span className="text-yellow-600 font-bold mt-0.5 flex-shrink-0">!</span>
              <span><strong>Annulation entre 10 et 13 jours avant la date :</strong> 50 % des frais de réservation sont conservés.</span>
            </div>
            <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3 text-sm">
              <span className="text-red-600 font-bold mt-0.5 flex-shrink-0">✗</span>
              <span><strong>Annulation &lt; 10 jours avant la date :</strong> Les frais de réservation sont intégralement conservés à titre d&apos;indemnité.</span>
            </div>
          </div>
          <p className="mb-3"><strong>6.3. Informations erronées communiquées par le Client :</strong> Le Client s&apos;engage à fournir des informations exactes concernant notamment le volume à déménager, les conditions d&apos;accès, les étages, la présence d&apos;ascenseur et toute contrainte technique. Si la situation constatée par le Déménageur lors du chargement diffère significativement des informations déclarées, le Déménageur pourra proposer un ajustement tarifaire ou refuser la prestation. Dans ce cas, le Déménageur pourra facturer des frais de déplacement raisonnables, dans la limite de 300 € TTC. TTD n&apos;intervient pas dans la fixation de ces frais. TTD ne saurait être tenue responsable des conséquences financières résultant d&apos;informations inexactes communiquées par le Client.</p>
          <p className="mb-3"><strong>6.4. Annulation par le Déménageur :</strong> En cas d&apos;annulation de la prestation par le Déménageur : si l&apos;annulation intervient plus de 7 jours avant la date prévue, TTD s&apos;efforcera de proposer au Client un autre déménageur dans des conditions tarifaires équivalentes ; si aucun professionnel ne peut être proposé au plus tard 5 jours avant la date du déménagement, les frais de réservation versés par le Client seront intégralement remboursés.</p>
          <p><strong>6.5. Absence du Client :</strong> Le Client ou son représentant doit être présent sur le lieu de chargement et de livraison aux horaires convenus. En cas d&apos;absence empêchant l&apos;exécution de la prestation, le Déménageur pourra facturer des frais de déplacement ou d&apos;attente raisonnables. Les frais de réservation versés à la plateforme restent acquis à TTD.</p>
        </>
      ),
    },
    {
      category: 'mediation',
      title: 'Article 7 – Médiation de la Consommation',
      content: (
        <>
          <p className="mb-3">Les présentes CGV constituent l&apos;intégralité de l&apos;accord entre les parties concernant l&apos;utilisation de la plateforme. Elles prévalent sur tout document informatif, notamment guides, FAQ ou supports marketing.</p>
          <p className="mb-3">Conformément aux articles L.612-1 et suivants du Code de la consommation, le Client peut saisir gratuitement le médiateur :</p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-900">SAS Médiation Solution Consommation</p>
            <p className="text-blue-700">222 chemin de la Bergerie – 01800 Saint Jean de Niost</p>
            <a href="https://sasmediationsolution-conso.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sasmediationsolution-conso.fr</a>
          </div>
        </>
      ),
    },
  ];

  const categories = [
    { id: 'definitions', label: 'Définitions' },
    { id: 'intermediaire', label: 'Statut d\'Intermédiaire' },
    { id: 'financier', label: 'Mécanisme Financier' },
    { id: 'preuve', label: 'Convention de Preuve' },
    { id: 'force_majeure', label: 'Force Majeure' },
    { id: 'annulation', label: 'Annulation' },
    { id: 'mediation', label: 'Médiation' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>

        <main>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Conditions Générales d&apos;Utilisation et de Vente</h1>
            <p className="text-lg text-gray-500">Version 2026.1 – Édition professionnelle révisée – www.trouvetondemenageur.fr</p>
          </div>

          {categories.map((cat) => {
            const catSections = sections.filter(s => s.category === cat.id);
            if (catSections.length === 0) return null;
            return (
              <div key={cat.id} className="mb-8">
                <div className="space-y-3">
                  {catSections.map((section) => {
                    const globalIndex = sections.indexOf(section);
                    const isOpen = openIndex === globalIndex;
                    return (
                      <div key={globalIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-lg font-semibold text-gray-900 pr-4">{section.title}</span>
                          <ChevronDown className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <div className="px-8 pb-6 text-gray-700 leading-relaxed">{section.content}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Une question sur nos CGU/CGV ?</h2>
            <p className="text-xl text-blue-100 mb-8">Notre équipe support est là pour vous aider</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a>
              <a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500">
                <Phone className="w-5 h-5" />01 89 70 78 81
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
