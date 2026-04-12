import { useState } from 'react';
import { Download, FileText, Users, Truck, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import * as XLSX from 'xlsx';

interface AdminExportsProps {
  adminRole?: string;
}

// Helper to style an Excel worksheet with auto-width, header styling, etc.
function enhanceWorksheet(ws: XLSX.WorkSheet, data: Record<string, any>[]) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  // Auto-fit column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    data.forEach(row => {
      const val = String(row[header] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(maxLen + 4, 50) };
  });
  ws['!cols'] = colWidths;

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  }
}

function downloadExcel(data: Record<string, any>[], sheetName: string, fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  enhanceWorksheet(ws, data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export default function AdminExports({ adminRole = '' }: AdminExportsProps) {
  const isSuperAdmin = adminRole === 'super_admin';
  const [loading, setLoading] = useState<string | null>(null);

  const exportUsers = async () => {
    setLoading('users');
    try {
      const { data: allUsers } = await supabase.rpc('get_all_users');
      const { data: clients } = await supabase.from('clients').select('user_id, first_name, last_name, phone');
      const { data: movers } = await supabase.from('movers').select('*');
      const { data: quoteRequestClients } = await supabase.from('quote_requests').select('client_user_id');

      const clientPhoneMap = new Map<string, { firstName?: string; lastName?: string; phone?: string }>();
      (clients || []).forEach((c: any) => {
        clientPhoneMap.set(c.user_id, {
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone,
        });
      });

      const moverMap = new Map<string, any>();
      (movers || []).forEach((m: any) => {
        moverMap.set(m.user_id, m);
      });

      const clientIds = new Set((quoteRequestClients || []).map((c: any) => c.client_user_id));
      const moverIds = new Set((movers || []).map((m: any) => m.user_id));

      const usersData = (allUsers || []).map((user: any) => {
        const isMover = moverIds.has(user.id);
        const isClient = clientIds.has(user.id) || clientPhoneMap.has(user.id);
        const mover = moverMap.get(user.id);
        const clientInfo = clientPhoneMap.get(user.id);

        let fullName = '';
        let phone = '';

        if (isMover && mover) {
          fullName = mover.company_name || '';
          phone = mover.phone || '';
        } else if (clientInfo) {
          fullName = [clientInfo.firstName, clientInfo.lastName].filter(Boolean).join(' ') || '';
          phone = clientInfo.phone || '';
        }

        return {
          'ID': user.id,
          'Nom / Entreprise': fullName || '-',
          'Email': user.email,
          'Téléphone / Mobile': phone || '-',
          'Type': isMover ? 'Déménageur' : isClient ? 'Client' : 'Inconnu',
          'SIRET': isMover && mover ? (mover.siret || '-') : '-',
          'Statut': isMover && mover ? (mover.is_active ? 'Actif' : 'Inactif') : 'Actif',
          'Date Inscription': new Date(user.created_at).toLocaleDateString('fr-FR'),
          'Dernière Connexion': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais',
        };
      });

      downloadExcel(usersData, 'Utilisateurs', `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export des utilisateurs réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast('Erreur lors de l\'export des utilisateurs', 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportMovers = async () => {
    setLoading('movers');
    try {
      const { data: movers } = await supabase.from('movers').select('*');
      const { data: allUsers } = await supabase.rpc('get_all_users');

      const moversData = (movers || []).map((mover: any) => {
        const authUser = (allUsers || []).find((u: any) => u.id === mover.user_id);
        return {
          'ID': mover.id,
          'Nom Entreprise': mover.company_name || '-',
          'Email': authUser?.email || mover.email || '-',
          'Téléphone / Mobile': mover.phone || '-',
          'SIRET': mover.siret || '-',
          'Ville': mover.city || '-',
          'Code Postal': mover.postal_code || '-',
          'Statut Vérification': mover.verification_status === 'verified' ? 'Vérifié' :
            mover.verification_status === 'pending' ? 'En attente' : mover.verification_status || '-',
          'Actif': mover.is_active ? 'Oui' : 'Non',
          'Note Moyenne': mover.average_rating ? Number(mover.average_rating).toFixed(1) : '-',
          'Nombre Avis': mover.total_reviews || 0,
          'Date Inscription': new Date(mover.created_at).toLocaleDateString('fr-FR'),
        };
      });

      downloadExcel(moversData, 'Déménageurs', `demenageurs_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export des déménageurs réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast('Erreur lors de l\'export des déménageurs', 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportQuotes = async () => {
    setLoading('quotes');
    try {
      const { data: quoteRequests } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const quotesData = (quoteRequests || []).map((quote: any) => ({
        'ID': quote.id,
        'Client': quote.client_name || '-',
        'Téléphone Client': quote.client_phone || '-',
        'Ville Départ': quote.from_city || '-',
        'Code Postal Départ': quote.from_postal_code || '-',
        'Ville Arrivée': quote.to_city || '-',
        'Code Postal Arrivée': quote.to_postal_code || '-',
        'Date Déménagement': quote.moving_date ? new Date(quote.moving_date).toLocaleDateString('fr-FR') : '-',
        'Volume (m³)': quote.volume_m3 || '-',
        'Surface (m²)': quote.surface_m2 || '-',
        'Statut': quote.status === 'pending' ? 'En attente' :
          quote.status === 'accepted' ? 'Accepté' :
          quote.status === 'completed' ? 'Terminé' :
          quote.status === 'cancelled' ? 'Annulé' : quote.status || '-',
        'Date Création': new Date(quote.created_at).toLocaleDateString('fr-FR'),
      }));

      downloadExcel(quotesData, 'Devis', `devis_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export des devis réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast('Erreur lors de l\'export des devis', 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportPayments = async () => {
    setLoading('payments');
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      const paymentsData = (payments || []).map((payment: any) => ({
        'ID': payment.id,
        'Montant Total (€)': payment.total_amount ? Number(payment.total_amount).toFixed(2) : '-',
        'Montant Escrow (€)': payment.escrow_amount ? Number(payment.escrow_amount).toFixed(2) : '-',
        'Commission (€)': payment.commission_amount ? Number(payment.commission_amount).toFixed(2) : '-',
        'Montant Déménageur (€)': payment.mover_amount ? Number(payment.mover_amount).toFixed(2) : '-',
        'Escrow Libéré': payment.escrow_released ? 'Oui' : 'Non',
        'Statut': payment.status || '-',
        'Statut Mission': payment.mission_completion_status || '-',
        'Date': new Date(payment.created_at).toLocaleDateString('fr-FR'),
      }));

      downloadExcel(paymentsData, 'Paiements', `paiements_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export des paiements réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast('Erreur lors de l\'export des paiements', 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportActivities = async () => {
    setLoading('activities');
    try {
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      const activitiesData = (activities || []).map((activity: any) => ({
        'ID': activity.id,
        'Type Action': activity.action_type || '-',
        'Description': activity.description || '-',
        'Date': new Date(activity.created_at).toLocaleDateString('fr-FR') + ' ' + new Date(activity.created_at).toLocaleTimeString('fr-FR'),
      }));

      downloadExcel(activitiesData, 'Activités', `activites_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export des activités réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast('Erreur lors de l\'export des activités', 'error');
    } finally {
      setLoading(null);
    }
  };

  const exports = [
    {
      id: 'users',
      title: 'Utilisateurs',
      description: 'Exporter tous les utilisateurs (clients et déménageurs)',
      icon: Users,
      color: 'bg-blue-500',
      onClick: exportUsers,
      restricted: false,
    },
    {
      id: 'movers',
      title: 'Déménageurs',
      description: 'Exporter la liste complète des déménageurs',
      icon: Truck,
      color: 'bg-purple-500',
      onClick: exportMovers,
      restricted: false,
    },
    {
      id: 'quotes',
      title: 'Devis',
      description: 'Exporter toutes les demandes de devis',
      icon: FileText,
      color: 'bg-green-500',
      onClick: exportQuotes,
      restricted: false,
    },
    {
      id: 'payments',
      title: 'Paiements',
      description: 'Exporter l\'historique des paiements',
      icon: DollarSign,
      color: 'bg-yellow-500',
      onClick: exportPayments,
      restricted: true,
    },
    {
      id: 'activities',
      title: 'Logs d\'Activité',
      description: 'Exporter les 1000 dernières actions',
      icon: Calendar,
      color: 'bg-orange-500',
      onClick: exportActivities,
      restricted: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exports de Données</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Exporter les données de la plateforme au format Excel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exports.map((exportItem) => {
          const Icon = exportItem.icon;
          const isRestricted = exportItem.restricted && !isSuperAdmin;
          const isLoading = loading === exportItem.id;

          return (
            <div
              key={exportItem.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                isRestricted ? 'opacity-50' : ''
              }`}
            >
              <div className={`w-12 h-12 ${exportItem.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {exportItem.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {exportItem.description}
              </p>
              <button
                onClick={exportItem.onClick}
                disabled={isRestricted || isLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isRestricted
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exporter
                  </>
                )}
              </button>
              {isRestricted && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Réservé aux Super Administrateurs
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Format Excel
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tous les exports sont au format .xlsx (Excel) pour une utilisation facile dans vos outils de reporting et d'analyse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
