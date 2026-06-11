'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HistoryEntry } from '@/types';

export function useItemHistory(householdId: string, itemId: string, maxEntries = 20) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'households', householdId, 'items', itemId, 'history'),
      orderBy('executedAt', 'desc'),
      firestoreLimit(maxEntries),
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryEntry)));
      setLoading(false);
    }, (error) => {
      console.error('history snapshot error:', error);
      setLoading(false);
    });
    return unsub;
  }, [householdId, itemId, maxEntries]);

  return { history, loading };
}
