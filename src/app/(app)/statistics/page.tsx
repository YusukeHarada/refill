'use client';

import { StatisticsView } from '@/components/statistics/StatisticsView';
import { useAuth } from '@/contexts/AuthContext';
import { useItems } from '@/hooks/useItems';

export default function StatisticsPage() {
  const { profile } = useAuth();
  const { items, loading } = useItems(profile?.householdId);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-safe-top pt-4 pb-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">支出統計</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <StatisticsView items={items} />
      )}
    </div>
  );
}
