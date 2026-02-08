import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MoverDocumentManager } from '../components/MoverDocumentManager';
import { MoverLayout } from '../components/MoverLayout';

export default function MoverDocumentsPage() {
  const { user } = useAuth();
  const [moverId, setMoverId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase.from('movers').select('id').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { if (data) setMoverId(data.id); setLoading(false); });
    }
  }, [user]);

  return (
    <MoverLayout title="Mes Documents">
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mes Documents</h2>
          <MoverDocumentManager moverId={moverId} />
        </div>
      )}
    </MoverLayout>
  );
}
