import React from 'react';

interface Props {
  label: string;
}

export function StatusChip({ label }: Props) {
  const style =
    label.toLowerCase().includes('ready')
      ? 'bg-emerald-100 text-emerald-800'
      : label.toLowerCase().includes('review')
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}
