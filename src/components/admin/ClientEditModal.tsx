import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface ClientEditModalProps {
  clientId: string;
  clientEmail: string;
  clientName?: string;
  clientPhone?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ClientEditModal({
  clientId,
  clientEmail,
  clientName = '',
  clientPhone = '',
  onClose,
  onSave,
}: ClientEditModalProps) {
  const [name, setName] = useState(clientName);
  const [phone, setPhone] = useState(clientPhone);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', clientId)
        .maybeSingle();

      if (existingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', clientId);

        if (error) throw error;
      } else {
        const { data: userEmail } = await supabase.rpc('get_user_email', {
          user_id_param: clientId
        });

        const { error } = await supabase
          .from('clients')
          .insert({
            user_id: clientId,
            email: userEmail || clientEmail,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          });

        if (error) throw error;
      }

      showToast('Informations client mises à jour avec succès', 'success');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Modifier les informations du client
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={clientEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du client"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Ces modifications seront appliquées aux demandes de devis existantes de ce client.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
