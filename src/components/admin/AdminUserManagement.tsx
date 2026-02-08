import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Truck,
  Search,
  Eye,
  Download,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import ClientDetailModal from './ClientDetailModal';
import MoverDetailModal from './MoverDetailModal';
import ImportUsersModal from './ImportUsersModal';

type UserType = 'all' | 'movers' | 'clients';
type UserStatus = 'all' | 'active' | 'inactive' | 'suspended' | 'banned';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  company_name?: string;
  siret?: string;
  phone?: string;
  verification_status?: string;
  is_active?: boolean;
  is_suspended?: boolean;
  is_banned?: boolean;
  total_quotes?: number;
  total_revenue?: number;
  last_activity?: string;
}

interface AdminUserManagementProps {
  adminRole?: string;
  initialUserType?: UserType;
  initialUserStatus?: UserStatus;
}

export default function AdminUserManagement({
  adminRole = '',
  initialUserType = 'all',
  initialUserStatus = 'all'
}: AdminUserManagementProps) {
  const isSuperAdmin = adminRole === 'super_admin';
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [userStatus, setUserStatus] = useState<UserStatus>(initialUserStatus);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewingClientDetails, setViewingClientDetails] = useState<string | null>(null);
  const [viewingMoverDetails, setViewingMoverDetails] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (userType === 'movers') {
        const [
          { data: movers },
          { data: allUsers },
        ] = await Promise.all([
          supabase.from('movers').select('*'),
          supabase.rpc('get_all_users'),
        ]);

        const formattedMovers: User[] = (movers || [])
          .map((m: any) => {
            const authUser = (allUsers || []).find((u: any) => u.id === m.user_id);
            return {
              id: m.user_id,
              email: authUser?.email || m.email || '',
              role: 'mover',
              created_at: m.created_at,
              company_name: m.company_name,
              siret: m.siret,
              phone: m.phone,
              verification_status: m.verification_status,
              is_active: m.is_active,
              is_suspended: m.is_suspended || false,
              is_banned: m.is_banned || false,
            };
          })
          .filter((m) => !m.email.endsWith('@trouveton.fr'));

        setUsers(formattedMovers);
        applyFilters(formattedMovers);
      } else if (userType === 'clients') {
        const [
          { data: admins },
          { data: movers },
          { data: clients },
          allUsersResult,
        ] = await Promise.all([
          supabase.from('admins').select('user_id'),
          supabase.from('movers').select('user_id'),
          supabase.from('clients').select('user_id, first_name, last_name, phone'),
          supabase.rpc('get_all_users'),
        ]);

        const adminUserIds = new Set(admins?.map((a: any) => a.user_id) || []);
        const moverUserIds = new Set(movers?.map((m: any) => m.user_id) || []);
        const allUsers = allUsersResult.data || [];

        const clientDataMap = new Map();

        clients?.forEach((client: any) => {
          if (client.user_id) {
            clientDataMap.set(client.user_id, {
              name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Non renseigné',
              phone: client.phone || 'Non renseigné',
            });
          }
        });

        const formattedClients: User[] = allUsers
          .filter((u: any) =>
            !adminUserIds.has(u.id) &&
            !moverUserIds.has(u.id) &&
            !u.email?.endsWith('@trouveton.fr')
          )
          .map((u: any) => {
            const clientData = clientDataMap.get(u.id);
            return {
              id: u.id,
              email: u.email || '',
              role: 'client',
              created_at: u.created_at,
              company_name: clientData?.name || 'Non renseigné',
              phone: clientData?.phone || 'Non renseigné',
              is_suspended: false,
              is_banned: false,
              is_active: true,
            };
          });

        setUsers(formattedClients);
        applyFilters(formattedClients);
      } else {
        const [
          { data: admins },
          { data: moversData },
          { data: clients },
          allUsersResult,
        ] = await Promise.all([
          supabase.from('admins').select('user_id'),
          supabase.from('movers').select('*'),
          supabase.from('clients').select('user_id, first_name, last_name, phone'),
          supabase.rpc('get_all_users'),
        ]);

        const adminUserIds = new Set(admins?.map((a: any) => a.user_id) || []);
        const moverUserIds = new Set(moversData?.map((m: any) => m.user_id) || []);
        const allUsers = allUsersResult.data || [];

        const clientDataMap = new Map();

        clients?.forEach((client: any) => {
          if (client.user_id) {
            clientDataMap.set(client.user_id, {
              name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Non renseigné',
              phone: client.phone || 'Non renseigné',
            });
          }
        });

        const formattedMovers: User[] = (await Promise.all(
          (moversData || []).map(async (m: any) => {
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id);
              return {
                id: m.user_id,
                email: authUser?.user?.email || m.email || '',
                role: 'mover',
                created_at: m.created_at,
                company_name: m.company_name,
                siret: m.siret,
                phone: m.phone,
                verification_status: m.verification_status,
                is_active: m.is_active,
                is_suspended: m.is_suspended || false,
                is_banned: m.is_banned || false,
              };
            } catch (error) {
              console.error(`Error loading mover ${m.user_id}:`, error);
              return {
                id: m.user_id,
                email: m.email || '',
                role: 'mover',
                created_at: m.created_at,
                company_name: m.company_name,
                siret: m.siret,
                phone: m.phone,
                verification_status: m.verification_status,
                is_active: m.is_active,
                is_suspended: m.is_suspended || false,
                is_banned: m.is_banned || false,
              };
            }
          })
        )).filter((m) => !m.email.endsWith('@trouveton.fr'));

        const formattedClients: User[] = allUsers
          .filter((u: any) =>
            !adminUserIds.has(u.id) &&
            !moverUserIds.has(u.id) &&
            !u.email?.endsWith('@trouveton.fr')
          )
          .map((u: any) => {
            const clientData = clientDataMap.get(u.id);
            return {
              id: u.id,
              email: u.email || '',
              role: 'client',
              created_at: u.created_at,
              company_name: clientData?.name || 'Non renseigné',
              phone: clientData?.phone || 'Non renseigné',
              is_suspended: false,
              is_banned: false,
              is_active: true,
            };
          });

        const allUsersList = [...formattedMovers, ...formattedClients];
        setUsers(allUsersList);
        applyFilters(allUsersList);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (userList: User[]) => {
    let filtered = [...userList];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.siret?.includes(searchTerm)
      );
    }

    if (userStatus !== 'all') {
      filtered = filtered.filter((user) => {
        switch (userStatus) {
          case 'active':
            return !user.is_suspended && !user.is_banned && user.is_active !== false;
          case 'inactive':
            return user.is_active === false && !user.is_suspended && !user.is_banned;
          case 'suspended':
            return user.is_suspended === true;
          case 'banned':
            return user.is_banned === true;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    loadUsers();

    const channel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movers',
        },
        () => {
          loadUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType]);

  useEffect(() => {
    applyFilters(users);
  }, [searchTerm, userStatus, users]);

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = async (action: 'approve' | 'suspend' | 'ban' | 'delete') => {
    if (selectedUsers.size === 0) {
      showToast('Aucun utilisateur sélectionné', 'error');
      return;
    }

    let confirmMessage = '';
    switch (action) {
      case 'approve':
        confirmMessage = `Êtes-vous sûr de vouloir approuver ${selectedUsers.size} utilisateur(s) ?`;
        break;
      case 'suspend':
        confirmMessage = `Êtes-vous sûr de vouloir suspendre ${selectedUsers.size} utilisateur(s) ?`;
        break;
      case 'ban':
        confirmMessage = `Êtes-vous sûr de vouloir bannir ${selectedUsers.size} utilisateur(s) ?`;
        break;
      case 'delete':
        confirmMessage = `⚠️ ATTENTION : Cette action est irréversible !\n\nÊtes-vous sûr de vouloir supprimer définitivement ${selectedUsers.size} utilisateur(s) ?\n\nToutes les données associées seront supprimées (devis, paiements, messages, etc.)`;
        break;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        const user = users.find((u) => u.id === userId);
        if (!user) continue;

        const table = user.role === 'mover' ? 'movers' : 'clients';

        switch (action) {
          case 'approve':
            if (user.role === 'mover') {
              // Update mover status
              await supabase
                .from('movers')
                .update({ verification_status: 'verified', is_active: true })
                .eq('user_id', userId);
              
              // Send welcome/validation email
              try {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    userType: 'mover',
                    email: user.email,
                    companyName: user.company_name,
                    isValidation: true
                  }),
                });
              } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Non-blocking, continue even if email fails
              }
            }
            break;
          case 'suspend':
            await supabase.from(table).update({ is_suspended: true }).eq('user_id', userId);
            break;
          case 'ban':
            await supabase.from(table).update({ is_banned: true }).eq('user_id', userId);
            break;
          case 'delete':
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/functions/v1/delete-auth-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Erreur lors de la suppression');
            }
            break;
        }
      }

      const actionLabels = {
        approve: 'Approbation',
        suspend: 'Suspension',
        ban: 'Bannissement',
        delete: 'Suppression'
      };

      showToast(`${actionLabels[action]} effectuée avec succès`, 'success');
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showToast('Erreur lors de l\'action groupée', 'error');
    }
  };

  const getStatusLabel = (user: User): string => {
    if (user.is_banned) return 'Banni';
    if (user.is_suspended) return 'Suspendu';
    if (user.role === 'mover' && user.verification_status === 'pending') return 'En attente';
    if (user.is_active === false) return 'Inactif';
    return 'Actif';
  };

  const exportUsers = () => {
    // Headers match the interface table columns exactly:
    // Utilisateur (Nom/Entreprise, Email, SIRET) | Type | Statut | Date Inscription | Téléphone
    const headers = ['Nom / Entreprise', 'Email', 'SIRET', 'Téléphone', 'Type', 'Statut', 'Date Inscription'];

    const rows = filteredUsers.map((u) => [
      u.company_name || u.email,
      u.email,
      u.siret || '',
      u.phone || '',
      u.role === 'mover' ? 'Déménageur' : 'Client',
      getStatusLabel(u),
      new Date(u.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeLabel = userType === 'clients' ? 'clients' : userType === 'movers' ? 'demenageurs' : 'utilisateurs';
    a.download = `${typeLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Export réussi', 'success');
  };

  const getUserStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Banni</span>;
    }
    if (user.is_suspended) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Suspendu</span>;
    }
    if (user.role === 'mover' && user.verification_status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">En attente</span>;
    }
    if (user.is_active === false) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactif</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Actif</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h2>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                title="Importer des contacts depuis Excel/CSV"
              >
                <Upload className="w-4 h-4" />
                Importer
              </button>
              <button
                onClick={exportUsers}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Exporter au format Excel (CSV)"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </>
          )}
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-visible">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, entreprise ou SIRET..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="movers">Déménageurs</option>
              <option value="clients">Clients</option>
            </select>

            <select
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value as UserStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">Suspendus</option>
              <option value="banned">Bannis</option>
            </select>
          </div>
        </div>

        {selectedUsers.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedUsers.size} utilisateur(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              {userType === 'movers' && (
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Approuver
                </button>
              )}
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Suspendre
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Date Inscription
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.company_name || user.email}
                        </p>
                        {user.company_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        )}
                        {user.siret && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">SIRET: {user.siret}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'mover' ? (
                          <>
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900 dark:text-white">Déménageur</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900 dark:text-white">Client</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">{getUserStatusBadge(user)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          if (user.role === 'client') {
                            setViewingClientDetails(user.id);
                          } else if (user.role === 'mover') {
                            setViewingMoverDetails(user.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{filteredUsers.length} utilisateur(s)</span>
        </div>
      </div>

      {viewingClientDetails && (
        <ClientDetailModal
          clientId={viewingClientDetails}
          onClose={() => setViewingClientDetails(null)}
          onUpdate={() => loadUsers()}
          adminRole={adminRole}
        />
      )}

      {viewingMoverDetails && (
        <MoverDetailModal
          moverId={viewingMoverDetails}
          onClose={() => setViewingMoverDetails(null)}
          onUpdate={() => loadUsers()}
        />
      )}

      {showImportModal && (
        <ImportUsersModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            loadUsers();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}
