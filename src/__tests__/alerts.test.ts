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
  describe('期限（交換サイクル）起因のアラート', () => {
    it('期限当日（残日数0）は overdue になる', () => {
      // lastUsedDate 2026-10-01 + cycleDays 4 = dueAt 2026-10-05（今日）
      const item = makeItem({ cycleDays: 4, stockQuantity: 5 });
      const alerts = toRefillAlerts([item], NOW);
      const cycleAlert = alerts.find((a) => a.id.endsWith('-cycle'));
      expect(cycleAlert?.level).toBe('overdue');
      expect(cycleAlert?.dueAt).toBe('2026-10-05T00:00:00+09:00');
    });

    it('しきい値ちょうど（残り7日）は warning になる', () => {
      const item = makeItem({ cycleDays: 11, stockQuantity: 5 });
      const alerts = toRefillAlerts([item], NOW);
      const cycleAlert = alerts.find((a) => a.id.endsWith('-cycle'));
      expect(cycleAlert?.level).toBe('warning');
    });

    it('しきい値+1日（残り8日）は期限起因のアラートが出ない', () => {
      const item = makeItem({ cycleDays: 12, stockQuantity: 5 });
      const alerts = toRefillAlerts([item], NOW);
      expect(alerts.find((a) => a.id.endsWith('-cycle'))).toBeUndefined();
    });

    it('期限切れ（残日数が負）は overdue になり、経過日数をdetailに含む', () => {
      const item = makeItem({ cycleDays: 2, stockQuantity: 5 });
      const alerts = toRefillAlerts([item], NOW);
      const cycleAlert = alerts.find((a) => a.id.endsWith('-cycle'));
      expect(cycleAlert?.level).toBe('overdue');
      expect(cycleAlert?.detail).toBe('2日超過');
    });

    it('在庫が十分でも期限が近ければ期限起因のアラートを出す（在庫とは独立）', () => {
      // dueAt 2026-10-12、残り7日、在庫10（十分）
      const item = makeItem({ cycleDays: 11, stockQuantity: 10 });
      const alerts = toRefillAlerts([item], NOW);
      const cycleAlert = alerts.find((a) => a.id.endsWith('-cycle'));
      expect(cycleAlert?.level).toBe('warning');
      expect(alerts.find((a) => a.id.endsWith('-stock'))).toBeUndefined();
    });
  });

  describe('在庫起因のアラート（期限とは独立）', () => {
    it('在庫0は dueAt を持たず overdue になる', () => {
      // cycleDays を長くして期限はまだ先にする
      const item = makeItem({ cycleDays: 365, stockQuantity: 0 });
      const alerts = toRefillAlerts([item], NOW);
      const stockAlert = alerts.find((a) => a.id.endsWith('-stock'));
      expect(stockAlert?.level).toBe('overdue');
      expect(stockAlert?.dueAt).toBeNull();
      expect(stockAlert?.detail).toBe('在庫0');
      // 期限はまだ先なので期限起因のアラートは出ない
      expect(alerts.find((a) => a.id.endsWith('-cycle'))).toBeUndefined();
    });

    it('在庫1(しきい値以下)は dueAt を持たず warning になる', () => {
      const item = makeItem({ cycleDays: 365, stockQuantity: 1 });
      const alerts = toRefillAlerts([item], NOW);
      const stockAlert = alerts.find((a) => a.id.endsWith('-stock'));
      expect(stockAlert?.level).toBe('warning');
      expect(stockAlert?.dueAt).toBeNull();
      expect(stockAlert?.detail).toBe('在庫1');
    });

    it('在庫2(しきい値超)は在庫起因のアラートを出さない', () => {
      const item = makeItem({ cycleDays: 365, stockQuantity: 2 });
      const alerts = toRefillAlerts([item], NOW);
      expect(alerts.find((a) => a.id.endsWith('-stock'))).toBeUndefined();
    });
  });

  describe('両方該当する場合', () => {
    it('期限切れかつ在庫0なら、2件のアラートを別々に出す', () => {
      const item = makeItem({ cycleDays: 2, stockQuantity: 0 });
      const alerts = toRefillAlerts([item], NOW);
      expect(alerts).toHaveLength(2);
      const cycleAlert = alerts.find((a) => a.id.endsWith('-cycle'));
      const stockAlert = alerts.find((a) => a.id.endsWith('-stock'));
      expect(cycleAlert?.detail).toBe('2日超過');
      expect(stockAlert?.detail).toBe('在庫0');
      expect(stockAlert?.dueAt).toBeNull();
    });
  });

  describe('共通の仕様', () => {
    it('type: task の項目も同じ規則で扱う', () => {
      const item = makeItem({ type: 'task', category: 'ハウスワーク', cycleDays: 4, stockQuantity: 5 });
      const alerts = toRefillAlerts([item], NOW);
      expect(alerts.find((a) => a.id.endsWith('-cycle'))?.level).toBe('overdue');
    });

    it('並び順は overdue → warning、同levelはdueAtが早い順（在庫起因は現在時刻扱いで先頭付近）', () => {
      const overdueLater = makeItem({ id: 'a', cycleDays: 3, stockQuantity: 5 }); // 2026-10-04 (1日経過)
      const overdueEarlier = makeItem({ id: 'b', cycleDays: 1, stockQuantity: 5 }); // 2026-10-02 (3日経過)
      const warningFar = makeItem({ id: 'c', cycleDays: 11, stockQuantity: 5 }); // 残り7日
      const warningNear = makeItem({ id: 'd', cycleDays: 5, stockQuantity: 5 }); // 残り1日
      const alerts = toRefillAlerts([warningFar, overdueLater, warningNear, overdueEarlier], NOW);
      expect(alerts.map((a) => a.id)).toEqual(['item-b-cycle', 'item-a-cycle', 'item-d-cycle', 'item-c-cycle']);
    });

    it('JST日付境界をまたいでも正しく判定する（UTCでの日付変わり目をテスト）', () => {
      const jstBoundaryNow = new Date('2026-10-04T15:00:00Z');
      const item = makeItem({ cycleDays: 4, stockQuantity: 5 });
      const [alert] = toRefillAlerts([item], jstBoundaryNow);
      expect(alert.level).toBe('overdue');

      const beforeBoundary = new Date('2026-10-04T14:59:00Z');
      const [warningAlert] = toRefillAlerts([item], beforeBoundary);
      expect(warningAlert.level).toBe('warning');
    });

    it('idは item-{id}-cycle / item-{id}-stock の形式', () => {
      const item = makeItem({ id: 'abc123', cycleDays: 2, stockQuantity: 0 });
      const alerts = toRefillAlerts([item], NOW);
      expect(alerts.map((a) => a.id).sort()).toEqual(['item-abc123-cycle', 'item-abc123-stock']);
    });

    it('visibility は household 固定', () => {
      const item = makeItem({ cycleDays: 4, stockQuantity: 5 });
      const [alert] = toRefillAlerts([item], NOW);
      expect(alert.visibility).toBe('household');
    });
  });
});
