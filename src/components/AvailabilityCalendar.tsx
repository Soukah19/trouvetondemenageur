import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

interface UnavailablePeriod {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

interface AvailabilityCalendarProps {
  moverId: string;
}

export function AvailabilityCalendar({ moverId }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnavailability();
  }, [moverId]);

  async function loadUnavailability() {
    try {
      const { data, error } = await supabase
        .from('mover_unavailability')
        .select('*')
        .eq('mover_id', moverId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setUnavailablePeriods(data || []);
    } catch (error) {
      console.error('Error loading unavailability:', error);
    }
  }

  async function addUnavailability() {
    if (!startDate || !endDate) {
      showToast('Veuillez sélectionner les dates', 'error');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showToast('La date de fin doit être après la date de début', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mover_unavailability')
        .insert({
          mover_id: moverId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || null,
        });

      if (error) throw error;

      showToast('Période d\'indisponibilité ajoutée', 'success');
      setShowAddModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadUnavailability();
    } catch (error) {
      console.error('Error adding unavailability:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUnavailability(id: string) {
    try {
      const { error } = await supabase
        .from('mover_unavailability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Période supprimée', 'success');
      loadUnavailability();
    } catch (error) {
      console.error('Error deleting unavailability:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }

  function isDateUnavailable(day: number) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    return unavailablePeriods.some(period => {
      return dateStr >= period.start_date && dateStr <= period.end_date;
    });
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Gestion des disponibilités
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter indisponibilité
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={previousMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-sm font-semibold capitalize">{monthName}</h4>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center text-xs rounded ${
                  day === null
                    ? ''
                    : isDateUnavailable(day)
                    ? 'bg-red-100 text-red-800 font-semibold'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Périodes indisponibles</h4>
          {unavailablePeriods.length === 0 ? (
            <p className="text-gray-500 text-xs">Aucune période d'indisponibilité</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {unavailablePeriods.map(period => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs">
                      {new Date(period.start_date).toLocaleDateString('fr-FR')} -{' '}
                      {new Date(period.end_date).toLocaleDateString('fr-FR')}
                    </p>
                    {period.reason && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{period.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteUnavailability(period.id)}
                    className="text-red-600 hover:text-red-700 p-1 flex-shrink-0 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Ajouter une période d'indisponibilité
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison (optionnel)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ex: Congés, maintenance du véhicule..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={addUnavailability}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}