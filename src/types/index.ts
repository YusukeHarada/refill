import { Timestamp } from 'firebase/firestore';

export type ItemType = 'item' | 'task';

export type Category =
  | '日用品'
  | 'ヘルスケア'
  | '食品'
  | 'ハウスワーク'
  | '定期メンテナンス'
  | 'その他';

export const CATEGORIES: Category[] = [
  '日用品',
  'ヘルスケア',
  '食品',
  'ハウスワーク',
  '定期メンテナンス',
  'その他',
];

export const CATEGORY_ICONS: Record<Category, string> = {
  '日用品': 'home',
  'ヘルスケア': 'heart-pulse',
  '食品': 'utensils',
  'ハウスワーク': 'sparkles',
  '定期メンテナンス': 'wrench',
  'その他': 'package',
};

export const CYCLE_TEMPLATES = [
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
  { label: '3ヶ月', days: 90 },
  { label: '半年', days: 180 },
  { label: '1年', days: 365 },
] as const;

export interface StockItem {
  id: string;
  householdId: string;
  name: string;
  category: Category;
  type: ItemType;
  price: number;
  cycleDays: number;
  stockQuantity: number;
  lastUsedDate: Timestamp;
  purchaseLocation?: string;
  memo?: string;
  registrationOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface StockItemInput {
  name: string;
  category: Category;
  type: ItemType;
  price: number;
  cycleDays: number;
  stockQuantity: number;
  purchaseLocation?: string;
  memo?: string;
}

export interface Household {
  id: string;
  name: string;
  members: string[];
  inviteCode: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  householdId?: string;
}

export type SortOrder = 'deadline' | 'category' | 'registrationOrder';

export type StatusColor = 'green' | 'yellow' | 'red';
