'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { StockItemList } from '@/components/home/StockItemList';
import { ItemForm } from '@/components/forms/ItemForm';
import { useAuth } from '@/contexts/AuthContext';
import { useItems } from '@/hooks/useItems';
import { addItem, updateItem, deleteItem, refillItem, restockItem } from '@/lib/firestore';
import type { StockItem, StockItemInput, SortOrder, Category } from '@/types';

export default function HomePage() {
  const { profile } = useAuth();
  const householdId = profile?.householdId;

  const [sortOrder, setSortOrder] = useState<SortOrder>('deadline');
  const [filterCategory, setFilterCategory] = useState<Category | undefined>();
  const [formState, setFormState] = useState<{ open: boolean; item?: StockItem }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null);

  const { items, loading } = useItems(householdId, sortOrder, filterCategory);

  if (!householdId) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 gap-4 text-center">
        <p className="text-zinc-500 text-sm">設定から世帯を作成または参加してください</p>
      </div>
    );
  }

  async function handleSave(input: StockItemInput) {
    if (!profile || !householdId) return;
    if (formState.item) {
      await updateItem(householdId, formState.item.id, input);
    } else {
      await addItem(householdId, profile.uid, input);
    }
    setFormState({ open: false });
  }

  async function handleDelete(item: StockItem) {
    if (!householdId) return;
    if (!confirm(`「${item.name}」を削除しますか？`)) return;
    await deleteItem(householdId, item.id);
  }

  async function handleRefill(item: StockItem) {
    if (!householdId) return;
    await refillItem(householdId, item);
  }

  async function handleRestock(item: StockItem) {
    if (!householdId) return;
    await restockItem(householdId, item.id, 1);
  }

  if (formState.open) {
    return (
      <div className="h-full overflow-y-auto">
        <ItemForm
          item={formState.item}
          onSave={handleSave}
          onCancel={() => setFormState({ open: false })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">在庫管理</h1>
        <button
          onClick={() => setFormState({ open: true })}
          className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StockItemList
            items={items}
            sortOrder={sortOrder}
            filterCategory={filterCategory}
            onSortChange={setSortOrder}
            onFilterChange={setFilterCategory}
            onRefill={handleRefill}
            onRestock={handleRestock}
            onEdit={(item) => setFormState({ open: true, item })}
            onDelete={handleDelete}
            onAddItem={() => setFormState({ open: true })}
          />
        )}
      </div>
    </div>
  );
}
