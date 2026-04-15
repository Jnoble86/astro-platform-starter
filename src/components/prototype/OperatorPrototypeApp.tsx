import React, { useMemo, useState } from 'react';
import { buildAdapterModel } from '../../prototype/adapter';
import { sourceData } from '../../prototype/sourceData';
import type { EstimateSession, EstimateStatus } from '../../prototype/types';
import { SectionCard } from './SectionCard';
import { StatusChip } from './StatusChip';
import { SummaryPanel } from './SummaryPanel';

type Nav = 'Dashboard' | 'New Estimate' | 'Estimates' | 'Approvals' | 'Outputs' | 'Admin';
const wizardSteps = ['Project', 'Scope', 'Inputs', 'Review and Output'] as const;

const now = new Date().toISOString();
const seedEstimates: EstimateSession[] = [
  {
    estimateId: 'EST-2401',
    projectName: 'North Yard Civils Refresh',
    clientName: 'Vic Rail Infra',
    siteName: 'North Yard',
    location: 'VIC Metro',
    workCategoryCode: 'WC-PIT',
    scopeItemCode: 'SI-PIT-NEW',
    deliveryMethodCode: 'DM-PIT-STD',
    status: 'Draft',
    reviewStatus: 'Review Required',
    quoteRequiredStatus: 'Quote Required',
    createdAt: now,
    updatedAt: now,
  },
  {
    estimateId: 'EST-2402',
    projectName: 'Generator Standby Program',
    clientName: 'Grid Support Co',
    siteName: 'Regional Depot',
    location: 'VIC Regional',
    workCategoryCode: 'WC-GEN',
    scopeItemCode: 'SI-GEN-HIRE-DAY',
    deliveryMethodCode: 'DM-GEN-HIRE-DAY-STD',
    status: 'In Review',
    reviewStatus: 'Review Required',
    quoteRequiredStatus: 'None',
    createdAt: now,
    updatedAt: now,
  },
  {
    estimateId: 'EST-2403',
    projectName: 'Hardstand Access Upgrade',
    clientName: 'Urban Utilities',
    siteName: 'West Compound',
    location: 'VIC Metro',
    workCategoryCode: 'WC-PAVE',
    scopeItemCode: 'SI-HDS-CONC',
    deliveryMethodCode: 'DM-HDS-CONC-LD',
    status: 'Ready',
    reviewStatus: 'Clear',
    quoteRequiredStatus: 'None',
    createdAt: now,
    updatedAt: now,
  },
];

export function OperatorPrototypeApp() {
  const [activeNav, setActiveNav] = useState<Nav>('Dashboard');
  const [wizardStep, setWizardStep] = useState(0);
  const [estimates, setEstimates] = useState(seedEstimates);
  const [activeEstimateId, setActiveEstimateId] = useState(seedEstimates[0].estimateId);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const activeEstimate =
    estimates.find((e) => e.estimateId === activeEstimateId) ?? estimates[0];

  const model = useMemo(
    () => buildAdapterModel(activeEstimate, answers),
    [activeEstimate, answers],
  );

  const updateEstimate = (patch: Partial<EstimateSession>) => {
    setEstimates((prev) =>
      prev.map((e) =>
        e.estimateId === activeEstimate.estimateId
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e,
      ),
    );
  };

  const createNewEstimate = () => {
    const created: EstimateSession = {
      estimateId: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
      projectName: '',
      clientName: '',
      siteName: '',
      location: '',
      status: 'Draft',
      reviewStatus: 'Clear',
      quoteRequiredStatus: 'None',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEstimates((prev) => [created, ...prev]);
    setActiveEstimateId(created.estimateId);
    setActiveNav('New Estimate');
    setWizardStep(0);
    setAnswers({});
  };

  const counts = {
    draft: estimates.filter((e) => e.status === 'Draft').length,
    review: estimates.filter((e) => e.status === 'In Review').length,
    ready: estimates.filter((e) => e.status === 'Ready').length,
    quoteFollowUp: estimates.filter((e) => e.quoteRequiredStatus === 'Quote Required').length,
  };

  const setStatus = (status: EstimateStatus) => {
    updateEstimate({ status });
  };

  const navItems: Nav[] = ['Dashboard', 'New Estimate', 'Estimates', 'Approvals', 'Outputs', 'Admin'];

  const projectPane = (
    <SectionCard title="Project" subtitle="Capture project header details">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Project name', 'projectName'],
          ['Client', 'clientName'],
          ['Site', 'siteName'],
          ['Location', 'location'],
        ].map(([label, field]) => (
          <label key={field} className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">{label}</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={(activeEstimate as any)[field] ?? ''}
              onChange={(e) => updateEstimate({ [field]: e.target.value } as any)}
            />
          </label>
        ))}
      </div>
    </SectionCard>
  );

  const selectedCategory = model.availableScopeChoices.find((c) => c.workCategoryCode === activeEstimate.workCategoryCode);
  const selectedScope = selectedCategory?.scopeItems.find((s) => s.scopeItemCode === activeEstimate.scopeItemCode);

  const scopePane = (
    <SectionCard title="Scope" subtitle="Select work category, scope item, and delivery path">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Work category</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={activeEstimate.workCategoryCode || ''}
            onChange={(e) =>
              updateEstimate({
                workCategoryCode: e.target.value || undefined,
                scopeItemCode: undefined,
                deliveryMethodCode: undefined,
              })
            }
          >
            <option value="">Select category</option>
            {model.availableScopeChoices.map((c) => (
              <option key={c.workCategoryCode} value={c.workCategoryCode}>
                {c.workCategoryLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Scope item</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={activeEstimate.scopeItemCode || ''}
            onChange={(e) => updateEstimate({ scopeItemCode: e.target.value || undefined, deliveryMethodCode: undefined })}
          >
            <option value="">Select scope item</option>
            {(selectedCategory?.scopeItems ?? []).map((s) => (
              <option key={s.scopeItemCode} value={s.scopeItemCode}>
                {s.scopeItemLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Delivery method</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={activeEstimate.deliveryMethodCode || ''}
            onChange={(e) => updateEstimate({ deliveryMethodCode: e.target.value || undefined })}
          >
            <option value="">Select delivery method</option>
            {(selectedScope?.availableDeliveryMethods ?? []).map((m) => (
              <option key={m.deliveryMethodCode} value={m.deliveryMethodCode}>
                {m.deliveryMethodLabel}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SectionCard>
  );

  const inputsPane = (
    <SectionCard title="Inputs" subtitle="Answer only questions relevant to the selected scope path">
      <div className="space-y-5">
        {model.activeQuestionGroups.map((group) => (
          <div key={group.groupId} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{group.groupLabel}</h4>
                <p className="text-xs text-slate-500">{group.groupDescription}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.questions.map((q) => (
                <label key={q.projectInputCode} className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">{q.label}</span>
                  {q.answerType === 'choice' ? (
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={answers[q.projectInputCode] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.projectInputCode]: e.target.value }))}
                    >
                      <option value="">Select option</option>
                      {q.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : q.answerType === 'yes/no' ? (
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={answers[q.projectInputCode] || 'no'}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.projectInputCode]: e.target.value }))}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={answers[q.projectInputCode] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.projectInputCode]: e.target.value }))}
                    />
                  )}
                  <span className="mt-1 block text-xs text-slate-500">{q.helpText}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const reviewPane = (
    <SectionCard
      title="Review and output"
      subtitle="Validate controls, review items, and prepare output"
      actions={<StatusChip label={model.estimateSummary.readyState} />}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h4 className="font-semibold">Triggered controls</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {(model.triggeredControls.warnings.length
              ? model.triggeredControls.warnings
              : ['No warnings triggered']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4 className="font-semibold">Quote-required items</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {(model.triggeredControls.quoteRequiredItems.length
              ? model.triggeredControls.quoteRequiredItems
              : ['No quote-required items currently triggered']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="mb-2 font-semibold">Operator actions</h4>
          <div className="grid gap-2">
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => setStatus('Draft')}>
              Save draft
            </button>
            <button className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => setStatus('In Review')}>
              Validate / send for review
            </button>
            <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => setStatus('Ready')}>
              Generate output
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const wizardContent = [projectPane, scopePane, inputsPane, reviewPane][wizardStep];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Estimator Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${activeNav === item ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                onClick={() => setActiveNav(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">Civil Estimator Prototype</h1>
              <p className="text-sm text-slate-500">Guided workflow wrapper for civils pricing model</p>
            </div>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={createNewEstimate}>
              Create new estimate
            </button>
          </header>

          <div className="grid gap-4 p-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {activeNav === 'Dashboard' && (
                <>
                  <SectionCard title="Dashboard" subtitle="Recent activity and queue health">
                    <div className="grid gap-3 md:grid-cols-4">
                      {[
                        ['Draft', counts.draft],
                        ['In review', counts.review],
                        ['Ready', counts.ready],
                        ['Quote follow-up', counts.quoteFollowUp],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                          <p className="text-2xl font-semibold">{val}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Recent estimates">
                    <div className="space-y-2">
                      {estimates.slice(0, 5).map((est) => (
                        <button
                          key={est.estimateId}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                          onClick={() => {
                            setActiveEstimateId(est.estimateId);
                            setActiveNav('Estimates');
                          }}
                        >
                          <div>
                            <p className="font-medium">{est.projectName || 'Untitled estimate'}</p>
                            <p className="text-xs text-slate-500">{est.clientName || 'Client pending'} · {est.location || 'Location pending'}</p>
                          </div>
                          <StatusChip label={est.status} />
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}

              {activeNav === 'Estimates' && (
                <SectionCard title="Estimates" subtitle="Searchable operator list">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="py-2">Project</th>
                          <th className="py-2">Client</th>
                          <th className="py-2">Location</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.map((e) => (
                          <tr
                            key={e.estimateId}
                            className="cursor-pointer border-b border-slate-100"
                            onClick={() => {
                              setActiveEstimateId(e.estimateId);
                              setActiveNav('New Estimate');
                            }}
                          >
                            <td className="py-2">{e.projectName || 'Untitled estimate'}</td>
                            <td className="py-2">{e.clientName || '-'}</td>
                            <td className="py-2">{e.location || '-'}</td>
                            <td className="py-2"><StatusChip label={e.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {activeNav === 'New Estimate' && (
                <>
                  <SectionCard title="New Estimate wizard" subtitle="Project → Scope → Inputs → Review and Output">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {wizardSteps.map((step, idx) => (
                        <button
                          key={step}
                          onClick={() => setWizardStep(idx)}
                          className={`rounded-full px-3 py-1 text-sm ${idx === wizardStep ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {idx + 1}. {step}
                        </button>
                      ))}
                    </div>
                    {wizardContent}
                    <div className="mt-4 flex justify-between">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        disabled={wizardStep === 0}
                        onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
                      >
                        Back
                      </button>
                      <button
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                        disabled={wizardStep === wizardSteps.length - 1}
                        onClick={() => setWizardStep((s) => Math.min(wizardSteps.length - 1, s + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </SectionCard>

                  <SectionCard title="Estimate detail" subtitle="Editable inputs + live summary + controls">
                    <div className="text-sm text-slate-600">
                      <p><strong>Project:</strong> {activeEstimate.projectName || 'Untitled'}</p>
                      <p><strong>Scope:</strong> {model.outputPreviewModel.scopeSummary}</p>
                      <p><strong>Review status:</strong> {activeEstimate.reviewStatus}</p>
                    </div>
                  </SectionCard>
                </>
              )}

              {activeNav === 'Approvals' && (
                <SectionCard title="Approvals / review queue" subtitle="Items requiring reviewer action">
                  <div className="space-y-2">
                    {estimates
                      .filter((e) => e.status === 'In Review' || e.quoteRequiredStatus === 'Quote Required')
                      .map((e) => (
                        <div key={e.estimateId} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="font-medium">{e.projectName || 'Untitled estimate'}</p>
                          <p className="text-sm text-amber-800">Requires review due to controls and/or quote-dependent items.</p>
                        </div>
                      ))}
                  </div>
                </SectionCard>
              )}

              {activeNav === 'Outputs' && (
                <SectionCard title="Output preview" subtitle="Quote-style summary for downstream export">
                  <div className="space-y-3 text-sm">
                    <p className="text-base font-semibold">{model.outputPreviewModel.projectHeader}</p>
                    <p>{model.outputPreviewModel.scopeSummary}</p>
                    {model.outputPreviewModel.groupedLineItems.map((group) => (
                      <div key={group.group} className="rounded-lg border border-slate-200 p-3">
                        <p className="font-semibold">{group.group}</p>
                        <ul className="mt-1 list-disc pl-5 text-slate-600">
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="font-medium">Footer: {model.outputPreviewModel.footerStatus}</p>
                  </div>
                </SectionCard>
              )}

              {activeNav === 'Admin' && (
                <SectionCard title="Admin" subtitle="Prototype placeholders for maintenance areas">
                  <div className="grid gap-3 md:grid-cols-2">
                    {['Rate Library', 'Standard Items', 'Production Assumptions', 'Import and Mapping', 'Audit and Gaps'].map((card) => (
                      <div key={card} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-semibold">{card}</p>
                        <p className="text-sm text-slate-500">Placeholder surface for future Dataverse-connected admin tooling.</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
            <SummaryPanel model={model} />
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500">
        Prototype note: quote-dependent placeholders remain unresolved for concrete pit risers, concrete pit lid and frame library, and geotextile / separator layer.
      </footer>
    </div>
  );
}
