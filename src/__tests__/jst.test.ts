import { describe, expect, it } from 'vitest';
import { addDaysToKey, diffDaysJst, jstDateKey, jstIso, jstParts } from '@/lib/jst';

describe('jstParts', () => {
  it('JST 23:59 の瞬間を正しく返す（UTC 14:59）', () => {
    const now = new Date('2026-10-04T14:59:00Z');
    expect(jstParts(now)).toEqual({ year: 2026, month: 10, day: 4, hour: 23, minute: 59 });
  });

  it('JST 0:00 ちょうどの瞬間を正しく返す（UTC 15:00）', () => {
    const now = new Date('2026-10-04T15:00:00Z');
    expect(jstParts(now)).toEqual({ year: 2026, month: 10, day: 5, hour: 0, minute: 0 });
  });
});

describe('jstDateKey', () => {
  it('UTC 14:59 は前日の日付キーになる', () => {
    expect(jstDateKey(new Date('2026-10-04T14:59:00Z'))).toBe('2026-10-04');
  });

  it('UTC 15:00 は次の日の日付キーになる', () => {
    expect(jstDateKey(new Date('2026-10-04T15:00:00Z'))).toBe('2026-10-05');
  });

  it('UTC 23:59 は JST 8:59 の日付キーになる', () => {
    expect(jstDateKey(new Date('2026-10-04T23:59:00Z'))).toBe('2026-10-05');
  });
});

describe('addDaysToKey', () => {
  it('年をまたぐ加算ができる', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('うるう年の2月29日を正しく扱う', () => {
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('平年の2月は28日までで3月1日になる', () => {
    expect(addDaysToKey('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('負の日数で過去に戻れる', () => {
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('jstIso', () => {
  it('日付キーと時刻から +09:00 付きのISO文字列を作る', () => {
    expect(jstIso('2026-10-05', 8, 0)).toBe('2026-10-05T08:00:00+09:00');
  });

  it('時刻省略時は 0:00 になる', () => {
    expect(jstIso('2026-10-05')).toBe('2026-10-05T00:00:00+09:00');
  });

  it('1桁の月日・時分も0埋めする', () => {
    expect(jstIso('2026-01-05', 3, 5)).toBe('2026-01-05T03:05:00+09:00');
  });
});

describe('diffDaysJst', () => {
  it('同じ日付キーなら差は0', () => {
    expect(diffDaysJst('2026-10-05', '2026-10-05')).toBe(0);
  });

  it('未来の日付キーとの差は正の値', () => {
    expect(diffDaysJst('2026-10-05', '2026-10-08')).toBe(3);
  });

  it('過去の日付キーとの差は負の値', () => {
    expect(diffDaysJst('2026-10-08', '2026-10-05')).toBe(-3);
  });

  it('月をまたぐ差分も正しく計算する', () => {
    expect(diffDaysJst('2026-10-30', '2026-11-02')).toBe(3);
  });
});
