'use client';

import { TrendingUp, Calendar, Package2 } from 'lucide-react';
import { formatCurrency, getCostByCategory, getTotalMonthlyCost, getTotalYearlyCost, getDailyCost } from '@/lib/utils';
import { CATEGORIES } from '@/types';
import type { StockItem } from '@/types';

interface StatisticsViewProps {
  items: StockItem[];
}

export function StatisticsView({ items }: StatisticsViewProps) {
  const pricedItems = items.filter((i) => i.price > 0);
  const monthly = getTotalMonthlyCost(pricedItems);
  const yearly = getTotalYearlyCost(pricedItems);
  const daily = monthly / 30;
  const byCat = getCostByCategory(pricedItems);
  const maxCost = Math.max(...Object.values(byCat), 1);

  return (
    <div className="px-4 pb-8 flex flex-col gap-6">
      {/* Total cost cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 mb-1">1日</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(daily)}</p>
        </div>
        <div className="bg-indigo-600 rounded-2xl p-3 shadow-sm text-center">
          <p className="text-xs text-indigo-200 mb-1">月間</p>
          <p className="text-base font-bold text-white">{formatCurrency(monthly)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 mb-1">年間</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(yearly)}</p>
        </div>
      </div>

      {pricedItems.length < items.length && (
        <p className="text-xs text-zinc-400 text-center -mt-3">
          ※ 価格未設定のアイテム {items.length - pricedItems.length}件は含まれていません
        </p>
      )}

      {/* Category breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">カテゴリ別（月間）</h3>
        </div>
        {CATEGORIES.map((cat) => {
          const cost = byCat[cat];
          const pct = (cost / maxCost) * 100;
          return (
            <div key={cat} className="px-4 py-3 border-b last:border-b-0 border-zinc-50 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(cost)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Item list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <Package2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">アイテム別コスト</h3>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-400 text-center">アイテムがありません</p>
        ) : (
          items
            .filter((i) => i.price > 0)
            .sort((a, b) => getDailyCost(b) - getDailyCost(a))
            .map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between border-b last:border-b-0 border-zinc-50 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.category} · {item.cycleDays}日サイクル</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(getDailyCost(item) * 30)}/月</p>
                  <p className="text-xs text-zinc-400">{formatCurrency(getDailyCost(item))}/日</p>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
