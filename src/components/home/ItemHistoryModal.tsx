'use client';

import { useState } from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { useItemHistory } from '@/hooks/useItemHistory';
import { deleteHistoryEntry } from '@/lib/firestore';
import type { StockItem } from '@/types';

interface ItemHistoryModalProps {
  householdId: string;
  item: StockItem;
  onClose: () => void;
}

export function ItemHistoryModal({ householdId, item, onClose }: ItemHistoryModalProps) {
  const { history, loading } = useItemHistory(householdId, item.id);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const isTask = item.type === 'task';

  async function handleDelete(entryId: string, date: Date) {
    if (!confirm(`${formatDate(date)} の履歴を削除しますか？`)) return;
    setDeletingId(entryId);
    setError('');
    try {
      await deleteHistoryEntry(householdId, item.id, entryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
              <p className="text-xs text-zinc-400">{isTask ? '実施履歴' : '使用開始履歴'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <p className="mb-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-8">履歴がありません</p>
          ) : (
            <ul className="flex flex-col">
              {history.map((entry, i) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 py-2.5 border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {formatDate(entry.executedAt.toDate())}
                  </p>
                  {i === 0 && (
                    <span className="text-xs text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                      最新
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(entry.id, entry.executedAt.toDate())}
                    disabled={deletingId === entry.id}
                    aria-label="履歴を削除"
                    className="ml-auto p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}
