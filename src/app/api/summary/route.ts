import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { toRefillAlerts } from '@/lib/alerts';
import { SummaryResponse } from '@/contract/summary';
import { jstDateKey, jstIso, jstParts } from '@/lib/jst';
import type { StockItem } from '@/types';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const expected = process.env.DASHBOARD_API_KEY;
  if (!expected) return false;

  const header = request.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;

  const expectedBuf = Buffer.from(expected);
  const tokenBuf = Buffer.from(token);
  if (expectedBuf.length !== tokenBuf.length) return false;
  return timingSafeEqual(expectedBuf, tokenBuf);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = process.env.REFILL_HOUSEHOLD_ID;
  if (!householdId) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  let items: StockItem[];
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection('households')
      .doc(householdId)
      .collection('items')
      .get();
    items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        lastUsedDate: data.lastUsedDate as unknown as ClientTimestamp,
        createdAt: data.createdAt as unknown as ClientTimestamp,
        updatedAt: data.updatedAt as unknown as ClientTimestamp,
      } as StockItem;
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const now = new Date();
  const alerts = toRefillAlerts(items, now);
  const { hour, minute } = jstParts(now);

  const payload: SummaryResponse = {
    version: 1,
    app: 'refill',
    generatedAt: jstIso(jstDateKey(now), hour, minute),
    alerts,
    events: [],
  };

  const result = SummaryResponse.safeParse(payload);
  if (!result.success) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json(result.data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
