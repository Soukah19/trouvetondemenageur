import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Settings,
  Bell,
  Shield,
  Zap,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { showToast } from '../../utils/toast';

interface SystemSettings {
  commission_rate: number;
  client_deposit_rate: number;
  mover_deposit_rate: number;
  notifications: {
    new_movers: boolean;
    new_payments: boolean;
    escrow_release: boolean;
    fraud_alerts: boolean;
    disputes: boolean;
  };
  features: {
    mover_signup: boolean;
    client_signup: boolean;
    bidding: boolean;
    messaging: boolean;
    ratings: boolean;
  };
  maintenance_mode: boolean;
}

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    commission_rate: 30,
    client_deposit_rate: 40,
    mover_deposit_rate: 10,
    notifications: {
      new_movers: true,
      new_payments: true,
      escrow_release: true,
      fraud_alerts: true,
      disputes: true,
    },
    features: {
      mover_signup: true,
      client_signup: true,
      bidding: true,
      messaging: true,
      ratings: true,
    },
    maintenance_mode: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

      if (platformSettings) {
        setSettings({
          commission_rate: platformSettings.commission_rate || 30,
          client_deposit_rate: platformSettings.client_deposit_percentage || 40,
          mover_deposit_rate: platformSettings.mover_deposit_percentage || 10,
          notifications: platformSettings.notifications || settings.notifications,
          features: platformSettings.features || settings.features,
          maintenance_mode: platformSettings.maintenance_mode || false,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1,
          commission_rate: settings.commission_rate,
          client_deposit_percentage: settings.client_deposit_rate,
          mover_deposit_percentage: settings.mover_deposit_rate,
          notifications: settings.notifications,
          features: settings.features,
          maintenance_mode: settings.maintenance_mode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        action_type: 'settings_update',
        description: 'Paramètres système mis à jour',
        user_id: null,
      });

      showToast('Paramètres sauvegardés avec succès', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres Système</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {key === 'new_movers' && 'Nouveaux déménageurs'}
                  {key === 'new_payments' && 'Nouveaux paiements'}
                  {key === 'escrow_release' && 'Escrow à libérer'}
                  {key === 'fraud_alerts' && 'Alertes de fraude'}
                  {key === 'disputes' && 'Litiges en cours'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, [key]: !value },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fonctionnalités
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(settings.features).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {key === 'mover_signup' && 'Inscription déménageurs'}
                  {key === 'client_signup' && 'Inscription clients'}
                  {key === 'bidding' && 'Système d\'enchères'}
                  {key === 'messaging' && 'Messagerie'}
                  {key === 'ratings' && 'Notation et avis'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      features: { ...settings.features, [key]: !value },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maintenance</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Mode Maintenance
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Activer ce mode rendra la plateforme inaccessible aux utilisateurs (sauf
                  administrateurs)
                </p>
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center gap-3">
                {settings.maintenance_mode ? (
                  <Lock className="w-5 h-5 text-red-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {settings.maintenance_mode ? 'Maintenance Activée' : 'Maintenance Désactivée'}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {settings.maintenance_mode
                      ? 'La plateforme est en maintenance'
                      : 'La plateforme est accessible'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenance_mode: !settings.maintenance_mode,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenance_mode
                    ? 'bg-red-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
