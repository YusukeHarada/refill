'use client';

import { useState } from 'react';
import { X, Package, ClipboardList } from 'lucide-react';
import { CyclePicker } from './CyclePicker';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/types';
import type { ItemType, StockItem, StockItemInput, Category } from '@/types';

interface ItemFormProps {
  item?: StockItem;
  onSave: (input: StockItemInput) => Promise<void>;
  onCancel: () => void;
}

export function ItemForm({ item, onSave, onCancel }: ItemFormProps) {
  const [type, setType] = useState<ItemType>(item?.type ?? 'item');
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? '日用品');
  const [price, setPrice] = useState(item?.price ? String(item.price) : '');
  const [cycleDays, setCycleDays] = useState(item?.cycleDays ?? 30);
  const [stockQuantity, setStockQuantity] = useState(item?.stockQuantity ?? 1);
  const [purchaseLocation, setPurchaseLocation] = useState(item?.purchaseLocation ?? '');
  const [memo, setMemo] = useState(item?.memo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isTask = type === 'task';
  const isValid = name.trim().length > 0 && cycleDays >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        type,
        name: name.trim(),
        category,
        price: price ? parseFloat(price) : 0,
        cycleDays,
        stockQuantity: isTask ? 0 : Math.max(1, stockQuantity),
        purchaseLocation: purchaseLocation.trim() || undefined,
        memo: memo.trim() || undefined,
      });
    } catch (err) {
      console.error('[ItemForm] save failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`保存に失敗しました: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {item ? '編集' : '追加'}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 flex flex-col gap-5">

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              タイプ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('item')}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors border ${
                  type === 'item'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Package className="w-4 h-4" />
                モノ（消耗品）
              </button>
              <button
                type="button"
                onClick={() => setType('task')}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors border ${
                  type === 'task'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                コト（作業）
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isTask ? '作業名' : '商品名'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isTask ? '例: エアコンフィルター掃除、オイル交換' : '例: シャンプー、洗剤'}
              className="w-full h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              カテゴリ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price — hidden for tasks */}
          {!isTask && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                価格（円）
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">¥</span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Cycle */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isTask ? '実施サイクル' : '消費サイクル'} <span className="text-red-500">*</span>
            </label>
            <CyclePicker value={cycleDays} onChange={setCycleDays} />
          </div>

          {/* Stock quantity — only for items */}
          {!isTask && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                現在の在庫数
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStockQuantity((v) => Math.max(0, v - 1))}
                  className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-lg font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  −
                </button>
                <span className="w-16 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {stockQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setStockQuantity((v) => v + 1)}
                  className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-lg font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ＋
                </button>
                <span className="text-sm text-zinc-400">個</span>
              </div>
            </div>
          )}

          {/* Purchase location — hidden for tasks */}
          {!isTask && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                購入場所（任意）
              </label>
              <input
                type="text"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
                placeholder="例: Amazon、コンビニ"
                className="w-full h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="備考など"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" className="flex-1" disabled={!isValid || saving}>
            {saving ? '保存中...' : item ? '更新する' : '追加する'}
          </Button>
        </div>
      </form>
    </div>
  );
}
