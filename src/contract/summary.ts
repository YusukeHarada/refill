import { z } from 'zod';

// "+09:00" 付きのISO 8601日時のみ許可する
export const JstIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/, 'JSTのISO日時（+09:00付き）で指定すること');

export const Visibility = z.enum(['household', 'personal']);

// 期限・残量など注意すべき項目（uchi-no-zaiko, refill, ごみカレンダーの更新案内）
export const Alert = z.object({
  id: z.string(),
  title: z.string(),
  level: z.enum(['overdue', 'warning', 'info']),
  dueAt: JstIso.nullable(),
  detail: z.string().optional(),
  visibility: Visibility,
  url: z.string().url().optional(),
});

// 予定（shift-manager, ごみ収集日）
export const Event = z.object({
  id: z.string(),
  title: z.string(),
  startAt: JstIso,
  endAt: JstIso,
  detail: z.string().optional(),
  visibility: Visibility,
  url: z.string().url().optional(),
});

export const SummaryResponse = z.object({
  version: z.literal(1),
  app: z.string(),
  generatedAt: JstIso,
  alerts: z.array(Alert).max(50),
  events: z.array(Event).max(20),
});

export type Alert = z.infer<typeof Alert>;
export type Event = z.infer<typeof Event>;
export type SummaryResponse = z.infer<typeof SummaryResponse>;
