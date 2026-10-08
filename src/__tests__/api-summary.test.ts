import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SummaryResponse } from '@/contract/summary';

const ORIGINAL_ENV = { ...process.env };

function makeFirestoreMock(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: async () => ({
            docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
          }),
        }),
      }),
    }),
  };
}

function makeTimestampLike(date: Date) {
  return { toDate: () => date };
}

function makeRequest(authHeader?: string) {
  return new Request('http://localhost/api/summary', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  process.env.DASHBOARD_API_KEY = 'test-secret-key';
  process.env.REFILL_HOUSEHOLD_ID = 'hh-1';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('GET /api/summary', () => {
  it('Authorizationヘッダーがないと401を返す', async () => {
    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminFirestore: () => makeFirestoreMock([]),
    }));
    const { GET } = await import('@/app/api/summary/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('キーが一致しないと401を返す', async () => {
    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminFirestore: () => makeFirestoreMock([]),
    }));
    const { GET } = await import('@/app/api/summary/route');
    const res = await GET(makeRequest('Bearer wrong-key'));
    expect(res.status).toBe(401);
  });

  it('キーが一致すると200で契約どおりのJSONを返す', async () => {
    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminFirestore: () =>
        makeFirestoreMock([
          {
            id: 'item-1',
            data: {
              name: 'トイレットペーパー',
              category: '日用品',
              type: 'item',
              price: 300,
              cycleDays: 1,
              stockQuantity: 0,
              lastUsedDate: makeTimestampLike(new Date('2026-01-01T00:00:00+09:00')),
              registrationOrder: 0,
              createdAt: makeTimestampLike(new Date('2026-01-01T00:00:00+09:00')),
              updatedAt: makeTimestampLike(new Date('2026-01-01T00:00:00+09:00')),
              createdBy: 'uid-1',
              householdId: 'hh-1',
            },
          },
        ]),
    }));
    const { GET } = await import('@/app/api/summary/route');
    const res = await GET(makeRequest('Bearer test-secret-key'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await res.json();
    expect(SummaryResponse.safeParse(body).success).toBe(true);
    expect(body.app).toBe('refill');
    expect(body.alerts).toHaveLength(1);
    expect(body.alerts[0].level).toBe('overdue');
  });

  it('アイテムが0件でも alerts: [] を返す（200）', async () => {
    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminFirestore: () => makeFirestoreMock([]),
    }));
    const { GET } = await import('@/app/api/summary/route');
    const res = await GET(makeRequest('Bearer test-secret-key'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alerts).toEqual([]);
    expect(body.events).toEqual([]);
  });

  it('Firestore取得に失敗すると500を返し、内部情報を含まない', async () => {
    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminFirestore: () => ({
        collection: () => ({
          doc: () => ({
            collection: () => ({
              get: async () => {
                throw new Error('permission-denied: secret-internal-path /var/db/firestore');
              },
            }),
          }),
        }),
      }),
    }));
    const { GET } = await import('@/app/api/summary/route');
    const res = await GET(makeRequest('Bearer test-secret-key'));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toMatch(/secret-internal-path/);
    expect(text).not.toMatch(/var\/db\/firestore/);
  });
});
