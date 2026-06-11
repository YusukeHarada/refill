'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createHousehold, joinHousehold, regenerateInviteCode } from '@/lib/firestore';
import type { Household } from '@/types';

export function useHousehold(householdId?: string) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (snap.exists()) {
        setHousehold({ id: snap.id, ...snap.data() } as Household);
      } else {
        setHousehold(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('household snapshot error:', error);
      setLoading(false);
    });
    return unsub;
  }, [householdId]);

  return { household, loading, createHousehold, joinHousehold, regenerateInviteCode };
}
