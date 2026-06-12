'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CYCLE_TEMPLATES } from '@/types';

interface CyclePickerProps {
  value: number;
  onChange: (days: number) => void;
}

export function CyclePicker({ value, onChange }: CyclePickerProps) {
  const [inputValue, setInputValue] = useState(String(value));

  function handleTemplate(days: number) {
    setInputValue(String(days));
    onChange(days);
  }

  function handleInputChange(raw: string) {
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1) onChange(num);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {CYCLE_TEMPLATES.map((t) => (
          <button
            key={t.days}
            type="button"
            onClick={() => handleTemplate(t.days)}
            className={cn(
              'px-3 py-2 rounded-xl text-sm font-medium transition-colors border',
              value === t.days
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="例: 60"
          className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-zinc-500">日</span>
      </div>
    </div>
  );
}
