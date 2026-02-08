import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { LoadingSpinner } from './LoadingSpinner';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  template_id: string | null;
}

interface ChecklistTemplate {
  id: string;
  title: string;
  description: string;
  phase: string;
  days_before_move: number;
}

interface MovingChecklistProps {
  userId: string;
  quoteRequestId?: string;
  movingDate?: string;
}

export default function MovingChecklist({ userId, quoteRequestId, movingDate }: MovingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', due_date: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, [userId, quoteRequestId]);

  async function loadData() {
    try {
      let query = supabase
        .from('user_checklist_items')
        .select('*')
        .eq('user_id', userId);

      if (quoteRequestId) {
        query = query.eq('quote_request_id', quoteRequestId);
      } else {
        query = query.is('quote_request_id', null);
      }

      const { data: itemsData, error: itemsError } = await query
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true });

      if (itemsError) throw itemsError;

      const { data: templatesData, error: templatesError } = await supabase
        .from('moving_checklist_templates')
        .select('*')
        .order('phase', { ascending: true })
        .order('order_index', { ascending: true });

      if (templatesError) throw templatesError;

      setItems(itemsData || []);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(itemId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('user_checklist_items')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, is_completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
          : item
      ));

      showToast(!currentStatus ? 'Tâche complétée' : 'Tâche marquée comme non complétée', 'success');
    } catch (error) {
      console.error('Error toggling item:', error);
      showToast('Erreur', 'error');
    }
  }

  async function addCustomItem() {
    if (!newItem.title.trim()) {
      showToast('Veuillez entrer un titre', 'error');
      return;
    }

    try {
      const insertData: {
        user_id: string;
        quote_request_id?: string;
        title: string;
        description: string | null;
        due_date: string | null;
      } = {
        user_id: userId,
        title: newItem.title,
        description: newItem.description || null,
        due_date: newItem.due_date || null
      };

      if (quoteRequestId) {
        insertData.quote_request_id = quoteRequestId;
      }

      const { error } = await supabase
        .from('user_checklist_items')
        .insert(insertData);

      if (error) throw error;

      showToast('Tâche ajoutée', 'success');
      setShowAddModal(false);
      setNewItem({ title: '', description: '', due_date: '' });
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    }
  }

  async function addFromTemplate(template: ChecklistTemplate) {
    try {
      let dueDate = null;
      if (movingDate && template.days_before_move > 0) {
        const date = new Date(movingDate);
        date.setDate(date.getDate() - template.days_before_move);
        dueDate = date.toISOString().split('T')[0];
      }

      const insertData: {
        user_id: string;
        quote_request_id?: string;
        template_id: string;
        title: string;
        description: string;
        due_date: string | null;
      } = {
        user_id: userId,
        template_id: template.id,
        title: template.title,
        description: template.description,
        due_date: dueDate
      };

      if (quoteRequestId) {
        insertData.quote_request_id = quoteRequestId;
      }

      const { error } = await supabase
        .from('user_checklist_items')
        .insert(insertData);

      if (error) throw error;

      showToast('Tâche ajoutée depuis le modèle', 'success');
      loadData();
    } catch (error) {
      console.error('Error adding from template:', error);
      showToast('Erreur', 'error');
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Supprimer cette tâche ?')) return;

    try {
      const { error } = await supabase
        .from('user_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      showToast('Tâche supprimée', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Erreur', 'error');
    }
  }

  if (loading) return <LoadingSpinner />;

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.is_completed;
    if (filter === 'completed') return item.is_completed;
    return true;
  });

  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ma Checklist de déménagement</h3>
            <p className="text-sm text-gray-600">
              {completedCount} sur {totalCount} tâches complétées
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium border border-blue-200"
            >
              Modèles
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter
            </button>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span>Progression</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes ({totalCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En cours ({totalCount - completedCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Complétées ({completedCount})
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">
            {filter === 'all' && 'Aucune tâche. Commencez par en ajouter!'}
            {filter === 'pending' && 'Aucune tâche en cours. Tout est fait!'}
            {filter === 'completed' && 'Aucune tâche complétée pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-lg p-4 transition ${
                item.is_completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id, item.is_completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                    item.is_completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {item.is_completed && <Check className="text-white" size={16} />}
                </button>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium ${
                      item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Calendar size={12} />
                      <span>
                        Date limite: {new Date(item.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une tâche</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Réserver le camion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date limite (optionnel)
                </label>
                <input
                  type="date"
                  value={newItem.due_date}
                  onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={addCustomItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplates && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTemplates(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Modèles de tâches</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-2xl transition"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {['before', 'during', 'after'].map((phase) => {
                const phaseTemplates = templates.filter(t => t.phase === phase);
                const phaseLabel = {
                  before: 'Avant le déménagement',
                  during: 'Pendant le déménagement',
                  after: 'Après le déménagement'
                }[phase];

                return (
                  <div key={phase} className="mb-6 last:mb-0">
                    <h4 className="font-semibold text-gray-900 mb-3 py-2">{phaseLabel}</h4>
                    <div className="space-y-2">
                      {phaseTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <div className="flex-1 pr-4">
                            <h5 className="font-medium text-gray-900">{template.title}</h5>
                            {template.description && (
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            )}
                            {template.days_before_move > 0 && movingDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Suggéré {template.days_before_move} jours avant le déménagement
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => addFromTemplate(template)}
                            className="ml-4 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium flex-shrink-0"
                          >
                            <Plus size={16} />
                            Ajouter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowTemplates(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
