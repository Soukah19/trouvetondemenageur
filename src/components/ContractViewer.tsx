import { useState, useEffect } from 'react';
import { FileText, Check, Loader, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ElectronicSignature } from './ElectronicSignature';
import { showToast } from '../utils/toast';

type Contract = {
  id: string;
  quote_id: string;
  client_id: string;
  mover_id: string;
  contract_text: string;
  status: string;
  created_at: string;
  expires_at: string;
};

type Signature = {
  id: string;
  contract_id: string;
  signer_id: string;
  signer_type: 'client' | 'mover';
  signature_data: string;
  signed_at: string;
};

type ContractViewerProps = {
  contractId: string;
  userType: 'client' | 'mover';
  onClose?: () => void;
};

export function ContractViewer({ contractId, userType, onClose }: ContractViewerProps) {
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signing, setSigning] = useState(false);
  const [hasUserSigned, setHasUserSigned] = useState(false);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      const { data: signaturesData, error: signaturesError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      if (signaturesError) throw signaturesError;
      setSignatures(signaturesData || []);

      const userSignature = signaturesData?.find(s => s.signer_id === user?.id);
      setHasUserSigned(!!userSignature);
    } catch (error) {
      console.error('Error loading contract:', error);
      showToast('Erreur lors du chargement du contrat', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!contract || !user) return;

    setSigning(true);
    try {
      const { error } = await supabase.from('contract_signatures').insert({
        contract_id: contract.id,
        signer_id: user.id,
        signer_type: userType,
        signature_data: signatureData,
        ip_address: 'unknown'
      });

      if (error) throw error;

      const allSignatures = [...signatures, {
        id: 'temp',
        contract_id: contract.id,
        signer_id: user.id,
        signer_type: userType,
        signature_data: signatureData,
        signed_at: new Date().toISOString()
      }];

      if (allSignatures.length === 2) {
        await supabase
          .from('contracts')
          .update({ status: 'signed' })
          .eq('id', contract.id);
      }

      showToast('Signature enregistrée avec succès', 'success');
      setShowSignaturePad(false);
      await loadContract();
    } catch (error) {
      console.error('Error saving signature:', error);
      showToast('Erreur lors de l\'enregistrement de la signature', 'error');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Contrat introuvable</p>
      </div>
    );
  }

  const clientSignature = signatures.find(s => s.signer_type === 'client');
  const moverSignature = signatures.find(s => s.signer_type === 'mover');
  const isFullySigned = contract.status === 'signed';
  const canSign = !hasUserSigned && contract.status !== 'signed' && contract.status !== 'cancelled';

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Contrat de Déménagement</h2>
              <p className="text-blue-100 text-sm">
                Statut: {isFullySigned ? '✓ Signé' : 'En attente de signature'}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white hover:text-blue-100">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        <div className="prose max-w-none mb-8">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
              {contract.contract_text}
            </pre>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              Signature du Client
              {clientSignature && <Check className="w-5 h-5 text-green-600" />}
            </h3>
            {clientSignature ? (
              <div>
                <img
                  src={clientSignature.signature_data}
                  alt="Signature client"
                  className="w-full h-32 object-contain border border-gray-200 rounded bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Signé le {new Date(clientSignature.signed_at).toLocaleString('fr-FR')}
                </p>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
                <p className="text-gray-400 text-sm">En attente</p>
              </div>
            )}
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              Signature du Déménageur
              {moverSignature && <Check className="w-5 h-5 text-green-600" />}
            </h3>
            {moverSignature ? (
              <div>
                <img
                  src={moverSignature.signature_data}
                  alt="Signature déménageur"
                  className="w-full h-32 object-contain border border-gray-200 rounded bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Signé le {new Date(moverSignature.signed_at).toLocaleString('fr-FR')}
                </p>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
                <p className="text-gray-400 text-sm">En attente</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          {canSign && (
            <button
              onClick={() => setShowSignaturePad(true)}
              disabled={signing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              Signer le contrat
            </button>
          )}

          {isFullySigned && (
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <Download className="w-5 h-5" />
              Télécharger le contrat
            </button>
          )}
        </div>

        {isFullySigned && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Ce contrat a été entièrement signé par toutes les parties et est juridiquement contraignant.
            </p>
          </div>
        )}
      </div>

      {showSignaturePad && (
        <ElectronicSignature
          onSave={handleSign}
          onCancel={() => setShowSignaturePad(false)}
          signerName={userType === 'client' ? 'Client' : 'Déménageur'}
        />
      )}
    </div>
  );
}
