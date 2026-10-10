import type { StockItem } from '@/types';
import type { Alert } from '@/contract/summary';
import { addDaysToKey, diffDaysJst, jstDateKey, jstIso } from '@/lib/jst';

// 初期しきい値。運用しながら調整する想定のため、ここに集約しておく。
export const REFILL_WARNING_DAYS = 7;
export const REFILL_WARNING_STOCK = 1;

type AlertWithSortKey = Alert & { sortKey: string };

// 期限（交換サイクル）と在庫切れは別の事象なので、それぞれ独立に判定し、
// 両方該当する場合は2件のアラートとして出す（在庫が十分でも期限が近いことはあるし、
// 逆に期限が先でも在庫が切れていることもあるため）。
export function toRefillAlerts(items: StockItem[], now: Date): Alert[] {
  const todayKey = jstDateKey(now);

  const alerts: AlertWithSortKey[] = [];

  for (const item of items) {
    const lastUsedKey = jstDateKey(item.lastUsedDate.toDate());
    const dueAtKey = addDaysToKey(lastUsedKey, item.cycleDays);
    const remainingDays = diffDaysJst(todayKey, dueAtKey);

    if (remainingDays <= 0) {
      alerts.push({
        id: `item-${item.id}-cycle`,
        title: item.name,
        level: 'overdue',
        dueAt: jstIso(dueAtKey),
        detail: `${Math.abs(remainingDays)}日超過`,
        visibility: 'household',
        sortKey: dueAtKey,
      });
    } else if (remainingDays <= REFILL_WARNING_DAYS) {
      alerts.push({
        id: `item-${item.id}-cycle`,
        title: item.name,
        level: 'warning',
        dueAt: jstIso(dueAtKey),
        detail: `あと${remainingDays}日`,
        visibility: 'household',
        sortKey: dueAtKey,
      });
    }

    if (item.stockQuantity === 0) {
      alerts.push({
        id: `item-${item.id}-stock`,
        title: item.name,
        level: 'overdue',
        dueAt: null,
        detail: '在庫0',
        visibility: 'household',
        sortKey: todayKey,
      });
    } else if (item.stockQuantity <= REFILL_WARNING_STOCK) {
      alerts.push({
        id: `item-${item.id}-stock`,
        title: item.name,
        level: 'warning',
        dueAt: null,
        detail: `在庫${item.stockQuantity}`,
        visibility: 'household',
        sortKey: todayKey,
      });
    }
  }

  const levelOrder = { overdue: 0, warning: 1, info: 2 } as const;
  alerts.sort((a, b) => {
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;
    return a.sortKey.localeCompare(b.sortKey);
  });

  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    level: alert.level,
    dueAt: alert.dueAt,
    detail: alert.detail,
    visibility: alert.visibility,
  }));
}
