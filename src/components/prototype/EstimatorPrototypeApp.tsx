import { useMemo, useState } from 'react';
import type {
  ActiveQuestionGroup,
  EstimateSession,
  PrototypeSeedData
} from '../../lib/prototypeAdapter';
import {
  computeEstimateSummary,
  computeOutputPreviewModel,
  computeTriggeredControls
} from '../../lib/prototypeAdapter';

type Props = {
  seedData: PrototypeSeedData;
};

type NavKey = 'Dashboard' | 'New Estimate' | 'Estimates' | 'Approvals' | 'Outputs' | 'Admin';
type WizardStep = 'Project' | 'Scope' | 'Inputs' | 'Review and Output';

const navItems: NavKey[] = ['Dashboard', 'New Estimate', 'Estimates', 'Approvals', 'Outputs', 'Admin'];
const wizardSteps: WizardStep[] = ['Project', 'Scope', 'Inputs', 'Review and Output'];

function classNames(...items: Array<string | false>): string {
  return items.filter(Boolean).join(' ');
}

export default function EstimatorPrototypeApp({ seedData }: Props) {
  const [activeNav, setActiveNav] = useState<NavKey>('Dashboard');
  const [wizardStep, setWizardStep] = useState<WizardStep>('Project');
  const [session, setSession] = useState<EstimateSession>(seedData.estimateSession);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const pathKey = `${session.scopeItemCode}::${session.deliveryMethodCode}`;
  const questionGroups: ActiveQuestionGroup[] = seedData.questionBank[pathKey] ?? [];

  const summary = useMemo(() => computeEstimateSummary(seedData, session), [seedData, session]);
  const controls = useMemo(() => computeTriggeredControls(seedData, session), [seedData, session]);
  const outputPreviewModel = useMemo(() => computeOutputPreviewModel(seedData, session), [seedData, session]);

  const selectedCategory = seedData.availableScopeChoices.find((item) => item.workCategoryCode === session.workCategoryCode);
  const selectedScope = selectedCategory?.scopeItems.find((item) => item.scopeItemCode === session.scopeItemCode);

  function updateProjectField(field: keyof EstimateSession, value: string) {
    setSession((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  }

  function onCategoryChange(code: string) {
    const category = seedData.availableScopeChoices.find((item) => item.workCategoryCode === code);
    const scope = category?.scopeItems[0];
    const method = scope?.availableDeliveryMethods[0];
    if (!category || !scope || !method) return;

    setSession((prev) => ({
      ...prev,
      workCategoryCode: code,
      scopeItemCode: scope.scopeItemCode,
      deliveryMethodCode: method.deliveryMethodCode,
      updatedAt: new Date().toISOString()
    }));
  }

  function onScopeChange(code: string) {
    const scope = selectedCategory?.scopeItems.find((item) => item.scopeItemCode === code);
    const method = scope?.availableDeliveryMethods[0];
    if (!scope || !method) return;

    setSession((prev) => ({
      ...prev,
      scopeItemCode: scope.scopeItemCode,
      deliveryMethodCode: method.deliveryMethodCode,
      updatedAt: new Date().toISOString()
    }));
  }

  function onMethodChange(code: string) {
    setSession((prev) => ({ ...prev, deliveryMethodCode: code, updatedAt: new Date().toISOString() }));
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 p-4 text-slate-100">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prototype</p>
            <h1 className="mt-2 text-lg font-semibold">Civils Quote Builder</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveNav(item)}
                className={classNames(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition',
                  activeNav === item ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="grid grid-cols-[1fr_360px]">
          <section className="p-6">
            <header className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{session.projectName}</h2>
                  <p className="text-sm text-slate-600">
                    {session.clientName} • {session.siteName} • {session.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Save draft</button>
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Validate</button>
                  <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">Send for review</button>
                </div>
              </div>
            </header>

            {activeNav === 'Dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    ['Draft', seedData.recentEstimates.filter((item) => item.status === 'Draft').length],
                    ['In review', seedData.recentEstimates.filter((item) => item.status === 'In Review').length],
                    ['Ready', seedData.recentEstimates.filter((item) => item.status === 'Ready').length],
                    ['Quote follow-up', summary.quoteRequiredItems.length]
                  ].map(([label, value]) => (
                    <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold">{value}</p>
                    </article>
                  ))}
                </div>

                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700">Recent estimates</h3>
                  <div className="mt-3 space-y-3">
                    {seedData.recentEstimates.map((estimate) => (
                      <div key={estimate.estimateId} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{estimate.projectName}</p>
                            <p className="text-xs text-slate-500">{estimate.estimateId}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{estimate.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}

            {activeNav === 'Estimates' && (
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Estimates</h3>
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search by project or client" />
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2">Estimate</th>
                      <th className="py-2">Client</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seedData.recentEstimates.map((estimate) => (
                      <tr key={estimate.estimateId} className="border-b border-slate-100">
                        <td className="py-2">{estimate.projectName}</td>
                        <td className="py-2">{estimate.clientName}</td>
                        <td className="py-2">{estimate.status}</td>
                        <td className="py-2">{estimate.reviewStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}

            {(activeNav === 'New Estimate' || activeNav === 'Outputs') && (
              <div className="space-y-6">
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {wizardSteps.map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setWizardStep(step)}
                        className={classNames(
                          'rounded-full px-3 py-1 text-xs',
                          wizardStep === step ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </article>

                {wizardStep === 'Project' && (
                  <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
                    <label className="text-sm">Project name
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.projectName} onChange={(e) => updateProjectField('projectName', e.target.value)} />
                    </label>
                    <label className="text-sm">Client
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.clientName} onChange={(e) => updateProjectField('clientName', e.target.value)} />
                    </label>
                    <label className="text-sm">Site
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.siteName} onChange={(e) => updateProjectField('siteName', e.target.value)} />
                    </label>
                    <label className="text-sm">Location
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.location} onChange={(e) => updateProjectField('location', e.target.value)} />
                    </label>
                  </article>
                )}

                {wizardStep === 'Scope' && (
                  <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
                    <label className="text-sm">Work category
                      <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.workCategoryCode} onChange={(e) => onCategoryChange(e.target.value)}>
                        {seedData.availableScopeChoices.map((choice) => (
                          <option key={choice.workCategoryCode} value={choice.workCategoryCode}>{choice.workCategoryLabel}</option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">Scope item
                      <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.scopeItemCode} onChange={(e) => onScopeChange(e.target.value)}>
                        {selectedCategory?.scopeItems.map((item) => (
                          <option key={item.scopeItemCode} value={item.scopeItemCode}>{item.scopeItemLabel}</option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">Delivery method
                      <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={session.deliveryMethodCode} onChange={(e) => onMethodChange(e.target.value)}>
                        {selectedScope?.availableDeliveryMethods.map((method) => (
                          <option key={method.deliveryMethodCode} value={method.deliveryMethodCode}>{method.deliveryMethodLabel}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                )}

                {wizardStep === 'Inputs' && (
                  <div className="space-y-4">
                    {questionGroups.map((group) => (
                      <article key={group.groupId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-sm font-semibold">{group.groupLabel}</h4>
                        <p className="mt-1 text-xs text-slate-500">{group.groupDescription}</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {group.questions.map((question) => (
                            <label key={question.projectInputCode} className="text-sm">
                              <span className="block font-medium text-slate-700">{question.label}</span>
                              {question.options.length > 0 ? (
                                <select
                                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                  value={answers[question.projectInputCode] ?? question.defaultValue}
                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.projectInputCode]: e.target.value }))}
                                >
                                  <option value="">Select</option>
                                  {question.options.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                  placeholder={question.answerType}
                                  value={answers[question.projectInputCode] ?? question.defaultValue}
                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.projectInputCode]: e.target.value }))}
                                />
                              )}
                              <span className="mt-1 block text-xs text-slate-500">{question.helpText}</span>
                            </label>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {wizardStep === 'Review and Output' && (
                  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-lg font-semibold">Output preview</h4>
                    <p className="text-sm text-slate-600">{outputPreviewModel.projectHeader}</p>
                    <p className="text-sm text-slate-500">{outputPreviewModel.scopeSummary}</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {outputPreviewModel.groupedLineItems.map((group) => (
                        <div key={group.group} className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">{group.group}</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {group.items.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Save draft</button>
                      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Validate</button>
                      <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Generate output</button>
                    </div>
                  </article>
                )}
              </div>
            )}

            {activeNav === 'Approvals' && (
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold">Approvals and review queue</h3>
                <div className="mt-4 space-y-3">
                  {controls.reviewHolds.map((item) => (
                    <div key={item} className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                      <p className="font-medium text-amber-900">Needs operational review</p>
                      <p className="text-sm text-amber-800">{item}</p>
                    </div>
                  ))}
                  {controls.quoteRequiredItems.map((item) => (
                    <div key={item} className="rounded-lg border border-rose-300 bg-rose-50 p-3">
                      <p className="font-medium text-rose-900">Quote follow-up required</p>
                      <p className="text-sm text-rose-800">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {activeNav === 'Admin' && (
              <div className="grid gap-4 md:grid-cols-2">
                {['Rate Library', 'Standard Items', 'Production Assumptions', 'Import and Mapping', 'Audit and Gaps'].map((name) => (
                  <article key={name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="font-semibold">{name}</h4>
                    <p className="mt-2 text-sm text-slate-600">Read-only prototype placeholder. Final Dataverse management controls to be connected later.</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="sticky top-0 h-screen border-l border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Live estimate summary</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-medium">Scope path</p>
                <p className="text-slate-600">{outputPreviewModel.scopeSummary}</p>
              </div>

              <div>
                <p className="font-medium">Base items ({summary.totals.baseCount})</p>
                <ul className="mt-1 space-y-1 text-slate-600">
                  {summary.baseItems.slice(0, 8).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div>
                <p className="font-medium">Add-ons ({summary.totals.addOnCount})</p>
                <ul className="mt-1 space-y-1 text-slate-600">
                  {summary.addOns.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium text-amber-900">Review holds</p>
                <ul className="mt-1 space-y-1 text-amber-800">
                  {controls.reviewHolds.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="font-medium text-rose-900">Quote-required items</p>
                <ul className="mt-1 space-y-1 text-rose-800">
                  {summary.quoteRequiredItems.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">Ready state</p>
                <p className="mt-1 text-slate-700">{summary.readyState}</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
