import React from 'react';
import type { AdapterModel } from '../../prototype/types';
import { StatusChip } from './StatusChip';

interface Props {
  model: AdapterModel;
}

export function SummaryPanel({ model }: Props) {
  const { estimateSummary, triggeredControls } = model;

  return (
    <aside className="sticky top-5 h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Live estimate summary</h3>
        <StatusChip label={estimateSummary.readyState} />
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-slate-700">Base items</p>
          <ul className="mt-1 list-disc pl-5 text-slate-600">
            {estimateSummary.baseItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium text-slate-700">Add-ons</p>
          <ul className="mt-1 list-disc pl-5 text-slate-600">
            {(estimateSummary.addOns.length ? estimateSummary.addOns : ['No add-ons triggered']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium text-slate-700">Review holds</p>
          <ul className="mt-1 list-disc pl-5 text-slate-600">
            {(triggeredControls.reviewHolds.length ? triggeredControls.reviewHolds : ['No review holds']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium text-slate-700">Quote-required items</p>
          <ul className="mt-1 list-disc pl-5 text-slate-600">
            {(estimateSummary.quoteRequiredItems.length
              ? estimateSummary.quoteRequiredItems
              : ['No quote-required items currently triggered']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Indicative range</p>
          <p className="text-lg font-semibold text-slate-900">{estimateSummary.totals.indicativeRange}</p>
          <p className="text-xs text-slate-500">{estimateSummary.totals.lineItemCount} line item groups</p>
        </div>
      </div>
    </aside>
  );
}
