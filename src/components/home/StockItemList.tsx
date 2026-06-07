'use client';

import { useState } from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';
import { StockItemCard } from './StockItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/types';
import type { StockItem, SortOrder, Category } from '@/types';

interface StockItemListProps {
  items: StockItem[];
  sortOrder: SortOrder;
  filterCategory?: Category;
  onSortChange: (order: SortOrder) => void;
  onFilterChange: (cat?: Category) => void;
  onRefill: (item: StockItem) => void;
  onRestock: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
  onAddItem: () => void;
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'deadline', label: '期限順' },
  { value: 'category', label: 'カテゴリ' },
  { value: 'registrationOrder', label: '登録順' },
];

export function StockItemList({
  items,
  sortOrder,
  filterCategory,
  onSortChange,
  onFilterChange,
  onRefill,
  onRestock,
  onEdit,
  onDelete,
  onAddItem,
}: StockItemListProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Filter/Sort bar */}
      <div className="px-4 pt-2 pb-3 flex flex-col gap-2">
        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onFilterChange(undefined)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              !filterCategory
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
            )}
          >
            すべて
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat === filterCategory ? undefined : cat)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                filterCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">{items.length}件</p>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSortMenu((v) => !v)}
              className="text-xs gap-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find((o) => o.value === sortOrder)?.label}
            </Button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg z-10 overflow-hidden min-w-28">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                      sortOrder === opt.value ? 'text-indigo-600 font-medium' : 'text-zinc-700 dark:text-zinc-300',
                    )}
                    onClick={() => {
                      onSortChange(opt.value);
                      setShowSortMenu(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {items.length === 0 ? (
          <EmptyState
            actionLabel="アイテムを追加"
            onAction={onAddItem}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <StockItemCard
                key={item.id}
                item={item}
                onRefill={onRefill}
                onRestock={onRestock}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
