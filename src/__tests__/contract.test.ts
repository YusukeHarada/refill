import { describe, expect, it } from 'vitest';
import { SummaryResponse } from '@/contract/summary';

const base = {
  version: 1 as const,
  app: 'refill',
  generatedAt: '2026-10-05T10:00:00+09:00',
};

describe('SummaryResponse', () => {
  it('alerts/events が空配列の最小形式を許可する', () => {
    const result = SummaryResponse.safeParse({ ...base, alerts: [], events: [] });
    expect(result.success).toBe(true);
  });

  it('level=overdue のalertを許可する', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [
        {
          id: 'item-1',
          title: 'トイレットペーパー',
          level: 'overdue',
          dueAt: '2026-10-04T00:00:00+09:00',
          detail: '在庫0',
          visibility: 'household',
        },
      ],
      events: [],
    });
    expect(result.success).toBe(true);
  });

  it('dueAt が +09:00 を持たないISO文字列だと拒否する', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [
        {
          id: 'item-1',
          title: 'トイレットペーパー',
          level: 'overdue',
          dueAt: '2026-10-04T00:00:00Z',
          visibility: 'household',
        },
      ],
      events: [],
    });
    expect(result.success).toBe(false);
  });

  it('dueAt が null のalertを許可する', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [
        {
          id: 'item-1',
          title: 'トイレットペーパー',
          level: 'info',
          dueAt: null,
          visibility: 'household',
        },
      ],
      events: [],
    });
    expect(result.success).toBe(true);
  });

  it('未知のlevelは拒否する', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [
        {
          id: 'item-1',
          title: 'トイレットペーパー',
          level: 'unknown',
          dueAt: null,
          visibility: 'household',
        },
      ],
      events: [],
    });
    expect(result.success).toBe(false);
  });

  it('eventはstartAt/endAtが必須でnullを許可しない', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [],
      events: [
        {
          id: 'shift-2026-10-05',
          title: '早番',
          startAt: '2026-10-05T07:30:00+09:00',
          endAt: '2026-10-05T16:15:00+09:00',
          visibility: 'household',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('version が 1 以外だと拒否する', () => {
    const result = SummaryResponse.safeParse({ ...base, version: 2, alerts: [], events: [] });
    expect(result.success).toBe(false);
  });

  it('url が不正なURLだと拒否する', () => {
    const result = SummaryResponse.safeParse({
      ...base,
      alerts: [
        {
          id: 'item-1',
          title: 'トイレットペーパー',
          level: 'warning',
          dueAt: null,
          visibility: 'household',
          url: 'not-a-url',
        },
      ],
      events: [],
    });
    expect(result.success).toBe(false);
  });
});
