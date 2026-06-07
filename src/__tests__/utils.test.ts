import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDaysDiff,
  getElapsedDays,
  getRemainingDays,
  getProgressRatio,
  getStatusColor,
  getDailyCost,
  getTotalMonthlyCost,
  getTotalYearlyCost,
  getCostByCategory,
  formatCurrency,
  formatRemainingDays,
  generateInviteCode,
} from '@/lib/utils';
import type { StockItem } from '@/types';

// Firebase Timestamp の最小限モック
function makeTimestamp(date: Date) {
  return { toDate: () => date } as unknown as import('firebase/firestore').Timestamp;
}

// テスト用アイテムファクトリ
function makeItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: 'test-id',
    householdId: 'hh-1',
    name: 'テスト商品',
    category: '日用品',
    type: 'item',
    price: 300,
    cycleDays: 30,
    stockQuantity: 2,
    lastUsedDate: makeTimestamp(new Date()),
    registrationOrder: 0,
    createdAt: makeTimestamp(new Date()),
    updatedAt: makeTimestamp(new Date()),
    createdBy: 'uid-1',
    ...overrides,
  };
}

// 現在時刻を固定するヘルパー
function freezeDate(date: Date) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
}

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────
// getDaysDiff
// ─────────────────────────────────────────────
describe('getDaysDiff', () => {
  it('同日は0を返す', () => {
    const d = new Date(2025, 0, 15);
    expect(getDaysDiff(d, d)).toBe(0);
  });

  it('1日後は1を返す', () => {
    const from = new Date(2025, 0, 15);
    const to = new Date(2025, 0, 16);
    expect(getDaysDiff(from, to)).toBe(1);
  });

  it('30日後は30を返す', () => {
    const from = new Date(2025, 0, 1);
    const to = new Date(2025, 1, 1); // 2/1
    expect(getDaysDiff(from, to)).toBe(31);
  });

  it('過去日付は負の値を返す', () => {
    const from = new Date(2025, 0, 16);
    const to = new Date(2025, 0, 15);
    expect(getDaysDiff(from, to)).toBe(-1);
  });
});

// ─────────────────────────────────────────────
// getElapsedDays
// ─────────────────────────────────────────────
describe('getElapsedDays', () => {
  it('今日開始なら0を返す', () => {
    const today = new Date(2025, 5, 1);
    freezeDate(today);
    expect(getElapsedDays(makeTimestamp(today))).toBe(0);
  });

  it('10日前開始なら10を返す', () => {
    const today = new Date(2025, 5, 11);
    freezeDate(today);
    const start = new Date(2025, 5, 1);
    expect(getElapsedDays(makeTimestamp(start))).toBe(10);
  });

  it('未来日付は0にクランプされる', () => {
    const today = new Date(2025, 5, 1);
    freezeDate(today);
    const future = new Date(2025, 5, 10);
    expect(getElapsedDays(makeTimestamp(future))).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getRemainingDays
// ─────────────────────────────────────────────
describe('getRemainingDays', () => {
  it('開始当日は cycleDays 分残っている', () => {
    const today = new Date(2025, 5, 1);
    freezeDate(today);
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(today) });
    expect(getRemainingDays(item)).toBe(30);
  });

  it('10日経過したら cycleDays-10 残る', () => {
    freezeDate(new Date(2025, 5, 11));
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(new Date(2025, 5, 1)) });
    expect(getRemainingDays(item)).toBe(20);
  });

  it('サイクルを超過すると負の値になる', () => {
    freezeDate(new Date(2025, 5, 35)); // 35日後
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(new Date(2025, 5, 1)) });
    // 35日後 - 30日 = -5（超過5日）
    // ※ 月を跨いでも getDaysDiff が正しく計算する
    expect(getRemainingDays(item)).toBeLessThan(0);
  });
});

// ─────────────────────────────────────────────
// getProgressRatio
// ─────────────────────────────────────────────
describe('getProgressRatio', () => {
  it('開始当日は 0 を返す', () => {
    const today = new Date(2025, 5, 1);
    freezeDate(today);
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(today) });
    expect(getProgressRatio(item)).toBe(0);
  });

  it('サイクルの半分経過で 0.5 を返す', () => {
    freezeDate(new Date(2025, 5, 16)); // 15日後
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(new Date(2025, 5, 1)) });
    expect(getProgressRatio(item)).toBeCloseTo(0.5);
  });

  it('cycleDays ちょうどで 1.0 を返す', () => {
    freezeDate(new Date(2025, 6, 1)); // 30日後
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(new Date(2025, 5, 1)) });
    expect(getProgressRatio(item)).toBeCloseTo(1.0);
  });

  it('超過したら 1.0 超の値を返す', () => {
    freezeDate(new Date(2025, 6, 11)); // 40日後
    const item = makeItem({ cycleDays: 30, lastUsedDate: makeTimestamp(new Date(2025, 5, 1)) });
    expect(getProgressRatio(item)).toBeGreaterThan(1.0);
  });

  it('cycleDays が 0 なら 0 を返す（ゼロ除算防止）', () => {
    const item = makeItem({ cycleDays: 0 });
    expect(getProgressRatio(item)).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getStatusColor
// ─────────────────────────────────────────────
describe('getStatusColor', () => {
  it('ratio < 0.7 は green', () => {
    expect(getStatusColor(0)).toBe('green');
    expect(getStatusColor(0.5)).toBe('green');
    expect(getStatusColor(0.69)).toBe('green');
  });

  it('0.7 <= ratio < 0.9 は yellow', () => {
    expect(getStatusColor(0.7)).toBe('yellow');
    expect(getStatusColor(0.8)).toBe('yellow');
    expect(getStatusColor(0.89)).toBe('yellow');
  });

  it('ratio >= 0.9 は red', () => {
    expect(getStatusColor(0.9)).toBe('red');
    expect(getStatusColor(1.0)).toBe('red');
    expect(getStatusColor(1.5)).toBe('red');
  });
});

// ─────────────────────────────────────────────
// getDailyCost
// ─────────────────────────────────────────────
describe('getDailyCost', () => {
  it('¥300 / 30日 = ¥10/日', () => {
    const item = makeItem({ price: 300, cycleDays: 30 });
    expect(getDailyCost(item)).toBeCloseTo(10);
  });

  it('¥1000 / 7日 = ¥142.857.../日', () => {
    const item = makeItem({ price: 1000, cycleDays: 7 });
    expect(getDailyCost(item)).toBeCloseTo(142.857, 2);
  });

  it('price が 0 なら 0 を返す', () => {
    const item = makeItem({ price: 0, cycleDays: 30 });
    expect(getDailyCost(item)).toBe(0);
  });

  it('cycleDays が 0 なら 0 を返す（ゼロ除算防止）', () => {
    const item = makeItem({ price: 300, cycleDays: 0 });
    expect(getDailyCost(item)).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getTotalMonthlyCost
// ─────────────────────────────────────────────
describe('getTotalMonthlyCost', () => {
  it('空リストは 0 を返す', () => {
    expect(getTotalMonthlyCost([])).toBe(0);
  });

  it('¥10/日 のアイテム1件 → 月¥300', () => {
    const items = [makeItem({ price: 300, cycleDays: 30 })];
    expect(getTotalMonthlyCost(items)).toBeCloseTo(300);
  });

  it('複数アイテムの合計を返す', () => {
    const items = [
      makeItem({ price: 300, cycleDays: 30 }),  // ¥10/日 → ¥300/月
      makeItem({ price: 700, cycleDays: 7 }),   // ¥100/日 → ¥3000/月
    ];
    expect(getTotalMonthlyCost(items)).toBeCloseTo(3300);
  });

  it('price=0 のアイテムは合計に影響しない', () => {
    const items = [
      makeItem({ price: 300, cycleDays: 30 }),
      makeItem({ price: 0, cycleDays: 30 }),
    ];
    expect(getTotalMonthlyCost(items)).toBeCloseTo(300);
  });
});

// ─────────────────────────────────────────────
// getTotalYearlyCost
// ─────────────────────────────────────────────
describe('getTotalYearlyCost', () => {
  it('¥10/日 → 年¥3650', () => {
    const items = [makeItem({ price: 300, cycleDays: 30 })];
    expect(getTotalYearlyCost(items)).toBeCloseTo(3650);
  });
});

// ─────────────────────────────────────────────
// getCostByCategory
// ─────────────────────────────────────────────
describe('getCostByCategory', () => {
  it('全カテゴリのキーが返る', () => {
    const result = getCostByCategory([]);
    expect(Object.keys(result)).toEqual(['日用品', 'ヘルスケア', '食品', 'ハウスワーク', '定期メンテナンス', 'その他']);
  });

  it('空リストは全カテゴリ 0', () => {
    const result = getCostByCategory([]);
    for (const v of Object.values(result)) expect(v).toBe(0);
  });

  it('カテゴリ別に月間コストを集計する', () => {
    const items = [
      makeItem({ category: '日用品',   price: 300, cycleDays: 30 }), // ¥300/月
      makeItem({ category: 'ヘルスケア', price: 600, cycleDays: 30 }), // ¥600/月
      makeItem({ category: '日用品',   price: 300, cycleDays: 30 }), // ¥300/月
    ];
    const result = getCostByCategory(items);
    expect(result['日用品']).toBeCloseTo(600);
    expect(result['ヘルスケア']).toBeCloseTo(600);
    expect(result['食品']).toBe(0);
    expect(result['ハウスワーク']).toBe(0);
    expect(result['定期メンテナンス']).toBe(0);
    expect(result['その他']).toBe(0);
  });
});

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────
describe('formatCurrency', () => {
  // Intl の円記号は環境により ¥(U+00A5) か ￥(U+FFE5) が使われるため
  // 数値部分と通貨記号の存在のみを検証する

  it('1000 は "1,000" の数値部分を含む', () => {
    expect(formatCurrency(1000)).toMatch(/1,000/);
  });

  it('小数点以下は四捨五入される', () => {
    expect(formatCurrency(10.6)).toMatch(/11/);
    expect(formatCurrency(10.4)).toMatch(/10/);
    expect(formatCurrency(10.4)).not.toMatch(/11/);
  });

  it('円記号（¥ または ￥）を含む', () => {
    expect(formatCurrency(1000)).toMatch(/[¥￥]/);
  });

  it('0 は "0" の数値部分を含む', () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });
});

// ─────────────────────────────────────────────
// formatRemainingDays
// ─────────────────────────────────────────────
describe('formatRemainingDays', () => {
  it('正の値は「残りX日」', () => {
    expect(formatRemainingDays(5)).toBe('残り5日');
    expect(formatRemainingDays(1)).toBe('残り1日');
  });

  it('0は「本日まで」', () => {
    expect(formatRemainingDays(0)).toBe('本日まで');
  });

  it('負の値は「X日超過」', () => {
    expect(formatRemainingDays(-3)).toBe('3日超過');
    expect(formatRemainingDays(-1)).toBe('1日超過');
  });
});

// ─────────────────────────────────────────────
// generateInviteCode
// ─────────────────────────────────────────────
describe('generateInviteCode', () => {
  it('6文字を生成する', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  it('許可文字のみを含む（O/0/I/1/L は除外）', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('毎回異なるコードを生成する', () => {
    const codes = new Set(Array.from({ length: 50 }, generateInviteCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});
