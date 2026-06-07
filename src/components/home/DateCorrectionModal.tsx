'use client';

import { useState } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { StockItem } from '@/types';

interface DateCorrectionModalProps {
  item: StockItem;
  onSave: (date: Date) => Promise<void>;
  onClose: () => void;
}

export function DateCorrectionModal({ item, onSave, onClose }: DateCorrectionModalProps) {
  const [dateStr, setDateStr] = useState(toDateInputValue(item.lastUsedDate.toDate()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isTask = item.type === 'task';
  const todayStr = toDateInputValue(new Date());

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      await onSave(new Date(y, m - 1, d));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
              <p className="text-xs text-zinc-400">
                {isTask ? '実施日を修正' : '使用開始日を修正'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="px-4 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isTask ? '実施日' : '使用開始日'}
            </label>
            <input
              type="date"
              value={dateStr}
              max={todayStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3 pb-4">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!dateStr || saving}>
              {saving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
