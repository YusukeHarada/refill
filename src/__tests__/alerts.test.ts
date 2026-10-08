import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { toRefillAlerts } from '@/lib/alerts';
import type { StockItem } from '@/types';

function makeTimestamp(date: Date): Timestamp {
  return { toDate: () => date } as unknown as Timestamp;
}

function makeItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: 'item-1',
    householdId: 'hh-1',
    name: 'トイレットペーパー',
    category: '日用品',
    type: 'item',
    price: 300,
    cycleDays: 30,
    stockQuantity: 2,
    lastUsedDate: makeTimestamp(new Date('2026-10-01T00:00:00+09:00')),
    registrationOrder: 0,
    createdAt: makeTimestamp(new Date('2026-10-01T00:00:00+09:00')),
    updatedAt: makeTimestamp(new Date('2026-10-01T00:00:00+09:00')),
    createdBy: 'uid-1',
    ...overrides,
  };
}

// now は常に 2026-10-05 12:00 JST (= UTC 2026-10-05T03:00:00Z) を基準にする
const NOW = new Date('2026-10-05T03:00:00Z');

describe('toRefillAlerts', () => {
  it('期限当日（残日数0）は overdue になる', () => {
    // lastUsedDate 2026-10-01 + cycleDays 4 = dueAt 2026-10-05（今日）
    const item = makeItem({ cycleDays: 4 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('overdue');
    expect(alert.dueAt).toBe('2026-10-05T00:00:00+09:00');
  });

  it('しきい値ちょうど（残り7日）は warning になる', () => {
    // dueAt 2026-10-12 → 残り7日
    const item = makeItem({ cycleDays: 11 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('warning');
  });

  it('しきい値+1日（残り8日）は結果に含まれない', () => {
    const item = makeItem({ cycleDays: 12 });
    expect(toRefillAlerts([item], NOW)).toHaveLength(0);
  });

  it('期限切れ（残日数が負）は overdue になる', () => {
    const item = makeItem({ cycleDays: 2 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('overdue');
  });

  it('在庫が0なら残日数に関わらず overdue になる', () => {
    const item = makeItem({ cycleDays: 90, stockQuantity: 0 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('overdue');
    expect(alert.detail).toBe('在庫0');
  });

  it('在庫が1なら残日数に余裕があっても warning になる', () => {
    const item = makeItem({ cycleDays: 90, stockQuantity: 1 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('warning');
  });

  it('在庫2・残日数も十分なら結果に含まれない', () => {
    const item = makeItem({ cycleDays: 90, stockQuantity: 2 });
    expect(toRefillAlerts([item], NOW)).toHaveLength(0);
  });

  it('detail に在庫数と残日数を含む', () => {
    // lastUsedDate 2026-10-01 + cycleDays 8 = dueAt 2026-10-09、今日(2026-10-05)から残り4日
    const item = makeItem({ cycleDays: 8, stockQuantity: 1 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.detail).toBe('在庫1・あと4日');
  });

  it('type: task の項目も同じ規則で扱う', () => {
    const item = makeItem({ type: 'task', category: 'ハウスワーク', cycleDays: 4 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.level).toBe('overdue');
  });

  it('並び順は overdue → warning、同levelはdueAtが近い順', () => {
    const overdueLater = makeItem({ id: 'a', cycleDays: 3 }); // 2026-10-04 (1日経過)
    const overdueEarlier = makeItem({ id: 'b', cycleDays: 1 }); // 2026-10-02 (3日経過)
    const warningFar = makeItem({ id: 'c', cycleDays: 11 }); // 残り7日
    const warningNear = makeItem({ id: 'd', cycleDays: 5 }); // 残り1日
    const alerts = toRefillAlerts([warningFar, overdueLater, warningNear, overdueEarlier], NOW);
    expect(alerts.map((a) => a.id)).toEqual(['item-b', 'item-a', 'item-d', 'item-c']);
  });

  it('JST日付境界をまたいでも正しく判定する（UTCでの日付変わり目をテスト）', () => {
    // now = UTC 2026-10-04T15:00:00Z = JST 2026-10-05 0:00
    const jstBoundaryNow = new Date('2026-10-04T15:00:00Z');
    // lastUsedDate 2026-10-01 + cycleDays 4 = dueAt 2026-10-05 → 今日なので overdue
    const item = makeItem({ cycleDays: 4 });
    const [alert] = toRefillAlerts([item], jstBoundaryNow);
    expect(alert.level).toBe('overdue');

    // now = UTC 2026-10-04T14:59:00Z = JST 2026-10-04 23:59（まだ前日・残り1日なのでwarning）
    const beforeBoundary = new Date('2026-10-04T14:59:00Z');
    const [warningAlert] = toRefillAlerts([item], beforeBoundary);
    expect(warningAlert.level).toBe('warning');
  });

  it('id は item- プレフィックス付きになる', () => {
    const item = makeItem({ id: 'abc123', cycleDays: 4 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.id).toBe('item-abc123');
  });

  it('visibility は household 固定', () => {
    const item = makeItem({ cycleDays: 4 });
    const [alert] = toRefillAlerts([item], NOW);
    expect(alert.visibility).toBe('household');
  });
});
