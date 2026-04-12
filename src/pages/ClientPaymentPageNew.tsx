import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Shield, AlertCircle, Banknote, Info, X, FileText, Tag, CheckCircle, Loader2 } from 'lucide-react';
import { calculatePriceBreakdown } from '../utils/marketPriceCalculation';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { ClientLayout } from '../components/ClientLayout';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Quote {
  id: string;
  quote_request_id: string;
  mover_id: string;
  client_display_price: number;
  quote_requests: {
    id: string;
    from_city: string;
    to_city: string;
    moving_date: string;
    from_address: string;
    to_address: string;
  };
}

interface PromoResult {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

// ─── INLINE LEGAL CONTENT ───────────────────────────────────────────────────

function CGUContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 1 – Définitions et Champ d'Application</h3>
        <p className="mb-3">Les présentes Conditions Générales (ci-après « CG ») régissent l'intégralité des relations contractuelles entre la société TROUVE TON DÉMÉNAGEUR (ci-après « TTD »), SASU au capital de 1 000 €, dont le siège social est situé au 60 rue François 1er, 75008 Paris, immatriculée au RCS de Paris sous le n° 101 378 248, et toute personne physique ou morale utilisant la plateforme (ci-après « le Client »).</p>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
          <p><strong>Plateforme :</strong> Ensemble des outils numériques, algorithmes et services accessibles sur www.trouvetondemenageur.fr.</p>
          <p><strong>Déménageur / Prestataire :</strong> Professionnel indépendant du transport de marchandises et du déménagement, dûment inscrit au Registre des Transporteurs, tiers à TTD. Le Déménageur garantit être inscrit au registre des transporteurs routiers conformément à la réglementation applicable.</p>
          <p><strong>Intermédiation :</strong> Service de mise en relation technique et fourniture d'outils de sécurisation (IA, Signature électronique et outils numériques de sécurisation).</p>
          <p><strong>Contrat de Transport :</strong> Contrat de prestation de services conclu exclusivement et directement entre le Client et le Déménageur.</p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 2 – Statut d'Intermédiaire et Neutralité Opérationnelle</h3>
        <p className="mb-2">TTD agit exclusivement en qualité d'éditeur d'une plateforme d'intermédiation en ligne au sens de l'article L. 111-7 du Code de la consommation. Son rôle se limite à la mise en relation technique entre un besoin de transport et une offre professionnelle.</p>
        <p className="mb-2">Le Client reconnaît expressément que TTD n'exerce aucune des prérogatives caractéristiques d'un transporteur ou d'un commissionnaire de transport :</p>
        <ul className="list-disc ml-5 space-y-1 mb-2">
          <li>TTD ne possède, ne loue, ni ne gère aucun véhicule de transport.</li>
          <li>TTD n'intervient pas dans l'organisation du transport.</li>
          <li>TTD n'exerce aucune autorité ni lien de subordination sur les Déménageurs.</li>
          <li>Les tarifs sont librement fixés par les Prestataires.</li>
        </ul>
        <p className="mb-2">En sa qualité de tiers au Contrat de Transport, TTD ne saurait être tenue pour responsable des dommages matériels (casse, vol, perte), corporels, des retards de livraison ou de l'inexécution de la prestation par le Déménageur.</p>
        <p className="mb-2">La responsabilité de TTD, toutes causes confondues, est strictement limitée au montant de la commission effectivement perçue par TTD au titre du dossier concerné.</p>
        <p>Le Client s'engage à ne pas contacter directement un Déménageur identifié via la plateforme dans le but de conclure une prestation en dehors de la plateforme. TTD se réserve le droit de suspendre ou supprimer l'accès au compte du Client en cas de contournement avéré.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 3 – Mécanisme Financier et Frais de Réservation</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 space-y-2">
          <p><strong>Frais de réservation (30 %) :</strong> Lors de la validation de la réservation, le Client règle des frais de réservation correspondant à 30 % du montant du devis affiché. Ces frais rémunèrent les services de mise en relation, de réservation du créneau et les outils numériques fournis par la plateforme.</p>
          <p><strong>Solde de la prestation (70 %) :</strong> Le solde est réglé directement entre le Client et le Déménageur au moment de l'exécution de la prestation. TTD n'intervient pas dans ce paiement.</p>
        </div>
        <p className="text-xs text-slate-500">Les frais de réservation versés à la plateforme correspondent à des frais de mise en relation et ne constituent pas un acompte sur la prestation de déménagement.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 4 – Convention de Preuve et Protocole de Protection IA</h3>
        <p className="mb-2">Conformément à l'article 1365 du Code civil, les parties conviennent que les logs système, les données horodatées, les coordonnées GPS et les rapports d'analyse générés par l'IA de TTD constituent une preuve électronique recevable et opposable.</p>
        <p className="mb-2">Pour bénéficier de l'assistance de TTD dans le traitement d'un éventuel litige, le Client s'engage à effectuer les clichés complets des biens avant chargement et à documenter tout dommage après livraison via l'interface TTD.</p>
        <p>Le « Rapport Technique de Constatation » généré par l'IA de TTD constitue un commencement de preuve par écrit facilitant le règlement amiable ou l'ouverture d'un dossier de sinistre.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 5 – Force Majeure</h3>
        <p className="mb-2">TTD ne pourra être tenue responsable de tout retard ou inexécution résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.</p>
        <p>Le Client s'engage à ne pas confier au Déménageur des objets dangereux, illégaux ou interdits au transport (matières inflammables, armes, substances dangereuses, produits illicites, espèces et objets de grande valeur non déclarés).</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 6 – Droit de Rétractation et Annulation</h3>
        <p className="mb-3">Conformément à l'article L. 221-28 12° du Code de la consommation, le droit de rétractation de 14 jours ne peut être exercé pour les contrats de prestations de services de transport de biens à une date déterminée.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-green-50 rounded-lg p-2 text-xs">
            <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">✓</span>
            <span><strong>Annulation ≥ 14 jours avant :</strong> Remboursement des frais de réservation (déduction faite des frais Stripe).</span>
          </div>
          <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-2 text-xs">
            <span className="text-yellow-600 font-bold mt-0.5 flex-shrink-0">!</span>
            <span><strong>Annulation entre 10 et 13 jours avant :</strong> 50 % des frais de réservation sont conservés.</span>
          </div>
          <div className="flex items-start gap-2 bg-red-50 rounded-lg p-2 text-xs">
            <span className="text-red-600 font-bold mt-0.5 flex-shrink-0">✗</span>
            <span><strong>Annulation &lt; 10 jours avant :</strong> Frais de réservation intégralement conservés à titre d'indemnité.</span>
          </div>
        </div>
        <p className="mt-3 text-xs">En cas d'annulation par le Déménageur plus de 7 jours avant, TTD s'efforcera de proposer un autre déménageur. Si aucun professionnel ne peut être proposé au plus tard 5 jours avant, les frais de réservation seront intégralement remboursés.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 7 – Médiation de la Consommation</h3>
        <p className="mb-2">Conformément aux articles L.612-1 et suivants du Code de la consommation, le Client peut saisir gratuitement :</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="font-semibold text-blue-900">SAS Médiation Solution Consommation</p>
          <p className="text-blue-700">222 chemin de la Bergerie – 01800 Saint Jean de Niost</p>
          <a href="https://sasmediationsolution-conso.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sasmediationsolution-conso.fr</a>
        </div>
      </section>

      <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-500">
        Version 2026.1 – Édition professionnelle révisée – www.trouvetondemenageur.fr
      </div>
    </div>
  );
}

function CGVContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 1 – Définitions et Champ d'Application</h3>
        <p className="mb-3">Les présentes Conditions Générales de Vente (CGV) régissent l'intégralité des relations contractuelles entre TTD et tout Client utilisant la Plateforme.</p>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
          <p><strong>Plateforme :</strong> Ensemble des outils numériques accessibles sur www.trouvetondemenageur.fr.</p>
          <p><strong>Déménageur :</strong> Professionnel indépendant, tiers à TTD, dûment inscrit au Registre des Transporteurs.</p>
          <p><strong>Intermédiation :</strong> Service de mise en relation technique et fourniture d'outils de sécurisation (IA, Signature électronique et outils numériques).</p>
          <p><strong>Contrat de Transport :</strong> Contrat conclu exclusivement entre le Client et le Déménageur.</p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 2 – Statut d'Intermédiaire et Responsabilité</h3>
        <p className="mb-2">TTD agit exclusivement en qualité d'éditeur d'une plateforme d'intermédiation en ligne (art. L. 111-7 Code de la consommation). TTD ne possède ni ne gère aucun véhicule, n'intervient pas dans l'organisation du transport et n'exerce aucune autorité sur les Déménageurs.</p>
        <p className="mb-2">TTD procède à une vérification administrative des documents fournis par les déménageurs (extrait Kbis, assurances, inscription au registre des transporteurs). Cette vérification ne constitue pas une garantie sur la qualité de l'exécution de la prestation.</p>
        <p>En conséquence, TTD ne saurait être tenue responsable des dommages matériels, corporels, des retards ou de l'inexécution de la prestation par le Déménageur. La responsabilité de TTD est strictement limitée au montant de la commission perçue au titre du dossier concerné.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 3 – Mécanisme Financier (Frais de réservation)</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 space-y-2">
          <p><strong>Frais de réservation (30 %) :</strong> Lors de la validation de la réservation, le Client règle des frais de réservation correspondant à 30 % du montant du devis affiché. Ces frais rémunèrent les services de mise en relation, de réservation du créneau et les outils numériques fournis par la plateforme.</p>
          <p><strong>Solde de la prestation (70 %) :</strong> Réglé directement entre le Client et le Déménageur au moment de l'exécution de la prestation. TTD n'intervient pas dans ce paiement.</p>
        </div>
        <p className="text-xs text-slate-500">Les frais de réservation versés à la plateforme correspondent à des frais de mise en relation et ne constituent pas un acompte sur la prestation de déménagement.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 4 – Convention de Preuve et Protocole IA</h3>
        <p className="mb-2">Les logs système, données horodatées et rapports d'analyse générés par l'IA de TTD constituent une preuve électronique recevable (art. 1365 Code civil).</p>
        <p>Pour bénéficier de l'assistance en cas de litige, le Client s'engage à photographier ses biens avant chargement et après livraison via l'interface TTD.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 5 – Force Majeure</h3>
        <p>TTD ne pourra être tenue responsable de tout retard ou inexécution résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 6 – Droit de Rétractation et Annulation</h3>
        <p className="mb-3">Conformément à l'article L. 221-28 12° du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contrats de transport fixés à une date déterminée.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-green-50 rounded-lg p-2 text-xs">
            <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">✓</span>
            <span><strong>Annulation ≥ 14 jours avant :</strong> Remboursement des frais de réservation (déduction faite des frais Stripe).</span>
          </div>
          <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-2 text-xs">
            <span className="text-yellow-600 font-bold mt-0.5 flex-shrink-0">!</span>
            <span><strong>Annulation entre 10 et 13 jours avant :</strong> 50 % des frais de réservation sont conservés.</span>
          </div>
          <div className="flex items-start gap-2 bg-red-50 rounded-lg p-2 text-xs">
            <span className="text-red-600 font-bold mt-0.5 flex-shrink-0">✗</span>
            <span><strong>Annulation &lt; 10 jours avant :</strong> Frais de réservation intégralement conservés à titre d'indemnité.</span>
          </div>
        </div>
        <p className="mt-3 text-xs">Le Client s'engage à fournir des informations exactes (volume, accès, étages). Si la situation diffère significativement, le Déménageur pourra proposer un ajustement tarifaire ou refuser la prestation, avec des frais de déplacement raisonnables dans la limite de 300 € TTC.</p>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-2">Article 7 – Médiation de la Consommation</h3>
        <p className="mb-2">Conformément aux articles L.612-1 et suivants du Code de la consommation, le Client peut saisir gratuitement :</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="font-semibold text-blue-900">SAS Médiation Solution Consommation</p>
          <p className="text-blue-700">222 chemin de la Bergerie – 01800 Saint Jean de Niost</p>
          <a href="https://sasmediationsolution-conso.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sasmediationsolution-conso.fr</a>
        </div>
      </section>

      <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-500">
        Version 2026.1 – Édition professionnelle révisée – www.trouvetondemenageur.fr
      </div>
    </div>
  );
}

// ─── COMBINED LEGAL MODAL ───────────────────────────────────────────────────

type LegalTab = 'cgu' | 'cgv';

function LegalModal({ defaultTab, onClose }: { defaultTab: LegalTab; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Conditions Générales</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 px-6">
          <button
            onClick={() => setActiveTab('cgu')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === 'cgu'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            CGU – Utilisation
          </button>
          <button
            onClick={() => setActiveTab('cgv')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === 'cgv'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            CGV – Vente
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {activeTab === 'cgu' ? <CGUContent /> : <CGVContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROMO CODE SECTION ─────────────────────────────────────────────────────

interface PromoCodeSectionProps {
  depositAmount: number;
  userId: string;
  appliedPromo: PromoResult | null;
  onPromoApplied: (promo: PromoResult) => void;
  onPromoRemoved: () => void;
}

function PromoCodeSection({
  depositAmount,
  userId,
  appliedPromo,
  onPromoApplied,
  onPromoRemoved,
}: PromoCodeSectionProps) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setValidating(true);
    setPromoError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-promo-code`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code.trim(), amount: depositAmount, userId }),
        }
      );
      const data = await response.json();

      if (!data.valid) {
        setPromoError(data.error || 'Code promo invalide');
      } else {
        onPromoApplied({
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          discount_amount: data.discount_amount,
        });
        setCode('');
      }
    } catch {
      setPromoError('Erreur lors de la validation du code');
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setPromoError('');
    setCode('');
    onPromoRemoved();
  };

  if (appliedPromo) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700">{appliedPromo.code}</span>
            <span className="text-xs text-green-600 ml-auto">
              {appliedPromo.discount_type === 'percentage'
                ? `-${appliedPromo.discount_value}%`
                : `-${appliedPromo.discount_value.toFixed(2)} €`}
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="px-3 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            Retirer
          </button>
        </div>
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Code « {appliedPromo.code} » appliqué ! Réduction de {appliedPromo.discount_amount.toFixed(2)} €
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setPromoError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Entrez un code promo..."
          className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={validating}
        />
        <button
          onClick={handleApply}
          disabled={validating || !code.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
        >
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
          Appliquer
        </button>
      </div>
      {promoError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {promoError}
        </p>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function ClientPaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalTab | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardMountedRef = useRef(false);

  // Initialize Stripe and create card element once
  useEffect(() => {
    let card: StripeCardElement | null = null;

    stripePromise.then(stripeInstance => {
      if (!stripeInstance) return;
      setStripe(stripeInstance);

      const elements = stripeInstance.elements();
      card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1e293b',
            fontFamily: '"Inter", system-ui, sans-serif',
            '::placeholder': { color: '#94a3b8' },
          },
          invalid: { color: '#ef4444' },
        },
        hidePostalCode: true,
      });

      card.on('ready', () => setCardReady(true));
      card.on('change', (event) => {
        setError(event.error ? (event.error.message || 'Erreur de carte') : '');
      });

      setCardElement(card);
    });

    return () => {
      if (card) { try { card.destroy(); } catch (e) { /* ignore */ } }
    };
  }, []);

  // Mount card element when DOM container and card element are both ready
  useEffect(() => {
    if (cardElement && cardContainerRef.current && !cardMountedRef.current) {
      cardElement.mount(cardContainerRef.current);
      cardMountedRef.current = true;
    }
  }, [cardElement, quote]);

  useEffect(() => { if (quoteId) fetchQuoteDetails(); }, [quoteId]);

  // Recreate PaymentIntent when quote loads or promo changes
  useEffect(() => {
    if (quote) createPaymentIntent();
  }, [quote, appliedPromo]);

  const fetchQuoteDetails = async () => {
    if (!quoteId) { setError('ID de devis manquant'); setLoading(false); return; }
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes').select('id, quote_request_id, mover_id, client_display_price, status')
        .eq('id', quoteId).maybeSingle();
      if (quoteError) throw quoteError;
      if (!quoteData) { setError('Devis introuvable'); setLoading(false); return; }

      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests').select('id, from_city, to_city, moving_date, from_address, to_address, status')
        .eq('id', quoteData.quote_request_id).maybeSingle();
      if (requestError) throw requestError;

      if (quoteData.status === 'expired') { setError('Ce devis a expiré.'); setLoading(false); return; }
      if (quoteData.status === 'rejected') { setError('Ce devis a été rejeté.'); setLoading(false); return; }
      if (quoteData.status === 'accepted') { navigate(`/client/payment-success?quoteId=${quoteId}`, { replace: true }); return; }
      if (quoteData.status !== 'pending') { setError('Ce devis ne peut pas être accepté.'); setLoading(false); return; }

      setQuote({ ...quoteData, quote_requests: requestData });
    } catch (err) { console.error(err); setError('Erreur lors du chargement'); }
    finally { setLoading(false); }
  };

  const createPaymentIntent = async () => {
    if (!quote) return;
    try {
      const breakdown = calculatePriceBreakdown(quote.client_display_price);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: breakdown.depositAmount,
            quoteId: quote.id,
            description: `Commission plateforme ${quote.quote_requests.from_city} → ${quote.quote_requests.to_city}`,
            ...(appliedPromo ? { promoCode: appliedPromo.code, userId: user?.id } : {}),
          }),
        }
      );
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Erreur paiement'); }
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) { console.error(err); setError(err.message || 'Erreur préparation paiement'); }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (!stripe || !cardElement || !clientSecret || !quote || !user) throw new Error('Le paiement n\'est pas prêt.');
      if (!acceptedTerms) throw new Error('Veuillez accepter les CGU et CGV.');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement, billing_details: { email: user.email } },
      });
      if (stripeError) throw new Error(stripeError.message || 'Erreur paiement');
      if (paymentIntent?.status !== 'succeeded') throw new Error(`Paiement non abouti: ${paymentIntent?.status}`);

      const breakdown = calculatePriceBreakdown(quote.client_display_price);
      const moverPrice = Math.round(quote.client_display_price / 1.3);
      const finalDeposit = appliedPromo
        ? Math.round((breakdown.depositAmount - appliedPromo.discount_amount) * 100) / 100
        : breakdown.depositAmount;

      const { error: paymentError } = await supabase.from('payments').insert({
        quote_request_id: quote.quote_request_id,
        quote_id: quote.id,
        client_id: user.id,
        mover_id: quote.mover_id,
        mover_price: moverPrice,
        total_amount: breakdown.totalAmount,
        deposit_amount: finalDeposit,
        amount_paid: finalDeposit,
        platform_fee: finalDeposit,
        guarantee_amount: 0,
        guarantee_status: 'none',
        mover_deposit: 0,
        escrow_amount: 0,
        remaining_amount: breakdown.remainingAmount,
        payment_status: 'completed',
        stripe_payment_id: paymentIntent.id,
        stripe_verified: true,
        stripe_verified_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      });
      if (paymentError) throw paymentError;

      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id);
      await supabase.from('quote_requests').update({ status: 'accepted', accepted_quote_id: quote.id, payment_status: 'deposit_paid' }).eq('id', quote.quote_request_id);
      await supabase.from('quotes').update({ status: 'rejected' }).eq('quote_request_id', quote.quote_request_id).neq('id', quote.id);

      setTimeout(() => navigate('/client/payment-success'), 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur paiement');
      setProcessing(false);
    }
  };

  // ─── LOADING / ERROR STATES ───
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Chargement...</p>
      </div>
    </div>
  );

  if (!quote) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Erreur</h2>
        <p className="text-slate-600 mb-6">{error || 'Devis introuvable'}</p>
        <button onClick={() => navigate('/client/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Retour</button>
      </div>
    </div>
  );

  const breakdown = calculatePriceBreakdown(quote.client_display_price);
  const finalDepositAmount = appliedPromo
    ? Math.round((breakdown.depositAmount - appliedPromo.discount_amount) * 100) / 100
    : breakdown.depositAmount;

  // ─── MAIN RENDER ───
  return (
    <ClientLayout title="Paiement de la réservation">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Paiement de la réservation</h1>
            <p className="text-slate-600 mt-2">{quote.quote_requests.from_city} → {quote.quote_requests.to_city}</p>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Comment fonctionne le paiement ?</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                    <div>
                      <p className="font-semibold">Frais de réservation plateforme maintenant</p>
                      <p className="text-blue-700">Payez {finalDepositAmount.toFixed(2)} € par carte bancaire pour confirmer votre réservation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                    <div>
                      <p className="font-semibold">Le reste de montant sera réglé au déménageur le jour J</p>
                      <p className="text-blue-700">Réglez les {breakdown.remainingAmount.toFixed(2)} € directement au déménageur</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recap */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Départ</span><span className="font-medium">{quote.quote_requests.from_city}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Arrivée</span><span className="font-medium">{quote.quote_requests.to_city}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Date</span><span className="font-medium">{new Date(quote.quote_requests.moving_date).toLocaleDateString('fr-FR')}</span></div>
              <div className="border-t pt-3 mt-3 flex justify-between">
                <span className="text-slate-600">Prix total TTC</span>
                <span className="font-semibold">{breakdown.totalAmount.toFixed(2)} €</span>
              </div>

              {/* Commission line – strikethrough if promo applied */}
              <div className="flex justify-between">
                <span className="text-slate-600">Frais de réservation plateforme (30%)</span>
                <span className={appliedPromo ? 'line-through text-slate-400' : 'font-medium text-blue-600'}>
                  {breakdown.depositAmount.toFixed(2)} €
                </span>
              </div>

              {/* Discount line */}
              {appliedPromo && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Code {appliedPromo.code}
                    </span>
                    <span className="font-medium">−{appliedPromo.discount_amount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-1">
                    <span className="font-semibold text-slate-800">Frais de réservation après réduction</span>
                    <span className="text-xl font-bold text-blue-600">{finalDepositAmount.toFixed(2)} €</span>
                  </div>
                </>
              )}

              {!appliedPromo && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>À payer maintenant</span>
                  <span className="text-xl font-bold">{breakdown.depositAmount.toFixed(2)} €</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-xs">
                <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />À régler au déménageur le jour J</span>
                <span>{breakdown.remainingAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Promo code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-500" />
              Code promo
            </label>
            <PromoCodeSection
              depositAmount={breakdown.depositAmount}
              userId={user?.id || ''}
              appliedPromo={appliedPromo}
              onPromoApplied={(promo) => setAppliedPromo(promo)}
              onPromoRemoved={() => setAppliedPromo(null)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* CGU/CGV Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                En cochant cette case, j&apos;accepte pleinement les{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('cgu')}
                  className="text-blue-600 font-semibold underline hover:text-blue-800"
                >
                  Conditions Générales d&apos;Utilisation (CGU)
                </button>
                {' '}et les{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('cgv')}
                  className="text-blue-600 font-semibold underline hover:text-blue-800"
                >
                  Conditions Générales de Vente (CGV)
                </button>
                {' '}de Trouve Ton Déménageur.
              </span>
            </label>
          </div>

          {/* Card form */}
          <form onSubmit={handleCardPayment} className={`space-y-6 ${!acceptedTerms ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Informations de carte bancaire</label>
              <div ref={cardContainerRef} className="w-full px-4 py-4 border border-slate-300 rounded-lg bg-white min-h-[44px]" />
              {!cardReady && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-slate-500">Chargement du formulaire de paiement...</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Paiement sécurisé par Stripe</span>
            </div>

            <button
              type="submit"
              disabled={processing || !cardReady || !clientSecret || !acceptedTerms}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Traitement en cours...</>
              ) : (
                <><Shield className="w-5 h-5" />Payer {finalDepositAmount.toFixed(2)} € en toute sécurité</>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-slate-500 mt-6">
          <p>Paiement sécurisé par Stripe • Vos données sont protégées</p>
        </div>
      </div>

      {/* Combined CGU/CGV Modal */}
      {legalModal && (
        <LegalModal
          defaultTab={legalModal}
          onClose={() => setLegalModal(null)}
        />
      )}
    </ClientLayout>
  );
}
