import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClientLayout } from '../components/ClientLayout';
import MovingChecklist from '../components/MovingChecklist';
import { supabase } from '../lib/supabase';

export default function ClientChecklistPage() {
  const { user } = useAuth();
  const [movingDate, setMovingDate] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      loadMovingDate();
    }
  }, [user]);

  const loadMovingDate = async () => {
    const { data } = await supabase
      .from('quote_requests')
      .select('moving_date')
      .eq('client_user_id', user?.id)
      .order('moving_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data?.moving_date) {
      setMovingDate(data.moving_date);
    }
  };

  return (
    <ClientLayout title="Ma Checklist de déménagement">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {user && (
            <MovingChecklist
              userId={user.id}
              movingDate={movingDate}
            />
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
