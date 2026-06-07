import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';
import type { Category, StatusColor, StockItem } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysDiff(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((utcTo - utcFrom) / msPerDay);
}

export function getElapsedDays(lastUsedDate: Timestamp): number {
  return Math.max(0, getDaysDiff(lastUsedDate.toDate(), new Date()));
}

export function getRemainingDays(item: StockItem): number {
  return item.cycleDays - getElapsedDays(item.lastUsedDate);
}

export function getProgressRatio(item: StockItem): number {
  if (item.cycleDays <= 0) return 0;
  const elapsed = getElapsedDays(item.lastUsedDate);
  return elapsed / item.cycleDays;
}

export function getStatusColor(ratio: number): StatusColor {
  if (ratio < 0.7) return 'green';
  if (ratio < 0.9) return 'yellow';
  return 'red';
}

export function getDailyCost(item: StockItem): number {
  if (!item.price || !item.cycleDays) return 0;
  return item.price / item.cycleDays;
}

export function getTotalMonthlyCost(items: StockItem[]): number {
  return items.reduce((sum, item) => sum + getDailyCost(item) * 30, 0);
}

export function getTotalYearlyCost(items: StockItem[]): number {
  return items.reduce((sum, item) => sum + getDailyCost(item) * 365, 0);
}

export function getCostByCategory(items: StockItem[]): Record<Category, number> {
  const result: Record<Category, number> = {
    '日用品': 0,
    'ヘルスケア': 0,
    '食品': 0,
    'その他': 0,
  };
  for (const item of items) {
    result[item.category] += getDailyCost(item) * 30;
  }
  return result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatRemainingDays(remainingDays: number): string {
  if (remainingDays < 0) return `${Math.abs(remainingDays)}日超過`;
  if (remainingDays === 0) return '本日まで';
  return `残り${remainingDays}日`;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
