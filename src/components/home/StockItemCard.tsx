'use client';

import { Home, HeartPulse, Utensils, Package, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/Button';
import { cn, getProgressRatio, getRemainingDays, getStatusColor, formatCurrency, formatRemainingDays, getDailyCost } from '@/lib/utils';
import type { Category, StockItem } from '@/types';

const CategoryIcon: Record<Category, React.ComponentType<{ className?: string }>> = {
  '日用品': Home,
  'ヘルスケア': HeartPulse,
  '食品': Utensils,
  'その他': Package,
};

interface StockItemCardProps {
  item: StockItem;
  onRefill: (item: StockItem) => void;
  onRestock: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
}

export function StockItemCard({ item, onRefill, onRestock, onEdit, onDelete }: StockItemCardProps) {
  const ratio = getProgressRatio(item);
  const color = getStatusColor(ratio);
  const remaining = getRemainingDays(item);
  const dailyCost = getDailyCost(item);
  const isOutOfStock = item.stockQuantity === 0;
  const Icon = CategoryIcon[item.category];

  return (
    <div className={cn(
      'bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800',
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
            <p className="text-xs text-zinc-500">{item.category}</p>
          </div>
        </div>

        {/* Stock badge */}
        <div className={cn(
          'flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
          isOutOfStock
            ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
            : item.stockQuantity === 1
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
        )}>
          {isOutOfStock ? '在庫切れ' : `${item.stockQuantity}個`}
        </div>
      </div>

      {/* Progress bar + days */}
      {!isOutOfStock ? (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('text-xs font-medium', {
              'text-emerald-600 dark:text-emerald-400': color === 'green',
              'text-amber-600 dark:text-amber-400': color === 'yellow',
              'text-red-600 dark:text-red-400': color === 'red',
            })}>
              {formatRemainingDays(remaining)}
            </span>
            {dailyCost > 0 && (
              <span className="text-xs text-zinc-400">{formatCurrency(dailyCost)}/日</span>
            )}
          </div>
          <ProgressBar ratio={ratio} color={color} />
        </div>
      ) : (
        <div className="mb-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-700" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onRefill(item)}
          disabled={isOutOfStock}
          title="使い切って次を開封"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          使用開始
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onRestock(item)}
          title="在庫を1つ補充"
        >
          <Plus className="w-3.5 h-3.5" />
          補充 +1
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="編集">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item)} title="削除">
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      </div>
    </div>
  );
}
