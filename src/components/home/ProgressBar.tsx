import { cn } from '@/lib/utils';
import type { StatusColor } from '@/types';

interface ProgressBarProps {
  ratio: number;
  color: StatusColor;
  className?: string;
}

const colorMap: Record<StatusColor, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
};

export function ProgressBar({ ratio, color, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, ratio * 100));

  return (
    <div className={cn('h-2 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300', colorMap[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
