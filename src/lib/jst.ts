// サーバー（UTC）とローカル（JST前提）の差異を吸収するための日時ヘルパー。
// Intl.DateTimeFormat のみで実装し、タイムゾーン変換ライブラリには依存しない。

export interface JstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const JST_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function jstParts(now: Date): JstParts {
  const parts = JST_FORMATTER.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function jstDateKey(now: Date): string {
  const { year, month, day } = jstParts(now);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

export function addDaysToKey(key: string, days: number): string {
  const { year, month, day } = parseKey(key);
  // UTC日付として扱うことで、JST表示との混同やDSTのような補正を避ける。
  const base = Date.UTC(year, month - 1, day);
  const result = new Date(base + days * 24 * 60 * 60 * 1000);
  return `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}`;
}

export function jstIso(key: string, hour = 0, minute = 0): string {
  return `${key}T${pad(hour)}:${pad(minute)}:00+09:00`;
}

export function diffDaysJst(fromKey: string, toKey: string): number {
  const from = parseKey(fromKey);
  const to = parseKey(toKey);
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}
