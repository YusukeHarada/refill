import type { StockItem } from '@/types';
import type { Alert } from '@/contract/summary';
import { addDaysToKey, diffDaysJst, jstDateKey, jstIso } from '@/lib/jst';

// 初期しきい値。運用しながら調整する想定のため、ここに集約しておく。
export const REFILL_WARNING_DAYS = 7;
export const REFILL_WARNING_STOCK = 1;

export function toRefillAlerts(items: StockItem[], now: Date): Alert[] {
  const todayKey = jstDateKey(now);

  const alerts: Array<Alert & { dueAtKey: string }> = [];

  for (const item of items) {
    const lastUsedKey = jstDateKey(item.lastUsedDate.toDate());
    const dueAtKey = addDaysToKey(lastUsedKey, item.cycleDays);
    const remainingDays = diffDaysJst(todayKey, dueAtKey);

    const isOverdue = remainingDays <= 0 || item.stockQuantity === 0;
    const isWarning =
      remainingDays <= REFILL_WARNING_DAYS || item.stockQuantity <= REFILL_WARNING_STOCK;

    if (!isOverdue && !isWarning) continue;

    const remainingLabel =
      remainingDays < 0 ? `${Math.abs(remainingDays)}日超過` : `あと${remainingDays}日`;
    const detail = item.stockQuantity === 0 ? '在庫0' : `在庫${item.stockQuantity}・${remainingLabel}`;

    alerts.push({
      id: `item-${item.id}`,
      title: item.name,
      level: isOverdue ? 'overdue' : 'warning',
      dueAt: jstIso(dueAtKey),
      detail,
      visibility: 'household',
      dueAtKey,
    });
  }

  const levelOrder = { overdue: 0, warning: 1, info: 2 } as const;
  alerts.sort((a, b) => {
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;
    return a.dueAtKey.localeCompare(b.dueAtKey);
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
