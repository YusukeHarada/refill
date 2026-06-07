'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getProgressRatio, getRemainingDays } from '@/lib/utils';
import type { StockItem, SortOrder, Category } from '@/types';

function sortItems(items: StockItem[], sortOrder: SortOrder): StockItem[] {
  return [...items].sort((a, b) => {
    if (sortOrder === 'deadline') {
      return getRemainingDays(a) - getRemainingDays(b);
    }
    if (sortOrder === 'category') {
      const catDiff = a.category.localeCompare(b.category, 'ja');
      if (catDiff !== 0) return catDiff;
      return getRemainingDays(a) - getRemainingDays(b);
    }
    return a.registrationOrder - b.registrationOrder;
  });
}

export function useItems(householdId?: string, sortOrder: SortOrder = 'deadline', filterCategory?: Category) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'households', householdId, 'items'),
      orderBy('registrationOrder', 'asc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // typeフィールドがない既存ドキュメントは 'item' として扱う
          type: data.type ?? 'item',
          // ヘルスケアカテゴリは日用品に統合済み
          category: data.category === 'ヘルスケア' ? '日用品' : data.category,
        } as StockItem;
      });
      const filtered = filterCategory ? raw.filter((i) => i.category === filterCategory) : raw;
      setItems(sortItems(filtered, sortOrder));
      setLoading(false);
    });

    return unsub;
  }, [householdId, sortOrder, filterCategory]);

  return { items, loading };
}

export { getProgressRatio, getRemainingDays };
