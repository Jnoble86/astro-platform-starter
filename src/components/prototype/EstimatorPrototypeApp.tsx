import { Fragment, useMemo, useState } from 'react';
import type { ActiveQuestionGroup, EstimateSession, PrototypeSeedData } from '../../lib/prototypeAdapter';
import { computeEstimateSummary, computeOutputPreviewModel, computeTriggeredControls } from '../../lib/prototypeAdapter';

type Props = { seedData: PrototypeSeedData };
type NavKey = 'Dashboard' | 'New Quote' | 'Quotes' | 'Reviews' | 'Outputs' | 'Admin';
type QuoteStep = 'Project' | 'Scope' | 'Inputs' | 'Quote Builder' | 'Review';

type QuoteLine = {
  id: string;
  section: 'Base items' | 'Conditional add-ons' | 'Review Required' | 'Quote Required';
  description: string;
  quantity: number;
  unit: string;
  rate: string;
  amount: string;
  status: string;
};

const navItems: NavKey[] = ['Dashboard', 'New Quote', 'Quotes', 'Reviews', 'Outputs', 'Admin'];
const quoteSteps: QuoteStep[] = ['Project', 'Scope', 'Inputs', 'Quote Builder', 'Review'];

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function money(value: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
}

function humanDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? value : d.toLocaleDateString('en-AU');
}

export default function EstimatorPrototypeApp({ seedData }: Props) {
  const [activeNav, setActiveNav] = useState<NavKey>('Dashboard');
  const [activeStep, setActiveStep] = useState<QuoteStep>('Project');
  const [session, setSession] = useState<EstimateSession>(seedData.estimateSession);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quoteMeta, setQuoteMeta] = useState({
    quoteNumber: session.estimateId,
    dateRaised: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    reference: 'Civil Works Package',
    currency: 'AUD',
    taxMode: 'Exclusive of GST'
  });

  const pathKey = `${session.scopeItemCode}::${session.deliveryMethodCode}`;
  const questionGroups: ActiveQuestionGroup[] = seedData.questionBank[pathKey] ?? [];

  const summary = useMemo(() => computeEstimateSummary(seedData, session), [seedData, session]);
  const controls = useMemo(() => computeTriggeredControls(seedData, session), [seedData, session]);
  const outputPreview = useMemo(() => computeOutputPreviewModel(seedData, session), [seedData, session]);

  const selectedCategory = seedData.availableScopeChoices.find((c) => c.workCategoryCode === session.workCategoryCode);
  const selectedScope = selectedCategory?.scopeItems.find((s) => s.scopeItemCode === session.scopeItemCode);
  const selectedMethod = selectedScope?.availableDeliveryMethods.find((m) => m.deliveryMethodCode === session.deliveryMethodCode);

  const quoteLines = useMemo<QuoteLine[]>(() => {
    const base: QuoteLine[] = summary.baseItems.map((item, idx) => {
      const quantity = idx % 2 === 0 ? 1 : 2;
      const rate = 1800 + idx * 275;
      return {
        id: `base-${idx}`,
        section: 'Base items',
        description: item,
        quantity,
        unit: 'item',
        rate: money(rate),
        amount: money(quantity * rate),
        status: 'Included'
      };
    });

    const addOns: QuoteLine[] = summary.addOns.map((item, idx) => ({
      id: `add-${idx}`,
      section: 'Conditional add-ons',
      description: item,
      quantity: 1,
      unit: 'allow',
      rate: money(950 + idx * 180),
      amount: money(950 + idx * 180),
      status: 'Conditional'
    }));

    const reviewRequired: QuoteLine[] = controls.reviewHolds.map((item, idx) => ({
      id: `review-${idx}`,
      section: 'Review Required',
      description: item,
      quantity: 1,
      unit: 'review',
      rate: 'TBC',
      amount: 'Pending review',
      status: 'Review Required'
    }));

    const quoteRequired: QuoteLine[] = summary.quoteRequiredItems.map((item, idx) => ({
      id: `quote-${idx}`,
      section: 'Quote Required',
      description: item,
      quantity: 1,
      unit: 'quote',
      rate: 'Supplier quote',
      amount: 'Unresolved',
      status: 'Quote Required'
    }));

    return [...base, ...addOns, ...reviewRequired, ...quoteRequired];
  }, [summary, controls.reviewHolds]);

  const subtotal = useMemo(
    () =>
      quoteLines
        .filter((line) => line.amount.startsWith('$'))
        .reduce((acc, line) => acc + Number(line.amount.replace(/[$,]/g, '')), 0),
    [quoteLines]
  );
  const gst = Math.round(subtotal * 0.1);
  const total = subtotal + gst;

  function patchSession<K extends keyof EstimateSession>(field: K, value: EstimateSession[K]) {
    setSession((prev) => ({ ...prev, [field]: value, updatedAt: new Date().toISOString() }));
  }

  function updateScope(workCategoryCode: string, scopeItemCode?: string, methodCode?: string) {
    const category = seedData.availableScopeChoices.find((c) => c.workCategoryCode === workCategoryCode);
    if (!category) return;

    const scope = category.scopeItems.find((s) => s.scopeItemCode === scopeItemCode) ?? category.scopeItems[0];
    if (!scope) return;

    const method = scope.availableDeliveryMethods.find((m) => m.deliveryMethodCode === methodCode) ?? scope.availableDeliveryMethods[0];
    if (!method) return;

    setSession((prev) => ({
      ...prev,
      workCategoryCode,
      scopeItemCode: scope.scopeItemCode,
      deliveryMethodCode: method.deliveryMethodCode,
      updatedAt: new Date().toISOString()
    }));
  }

  function renderStepRail() {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {quoteSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => setActiveStep(step)}
              className={cx(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                activeStep === step
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <span className={cx('grid h-5 w-5 place-items-center rounded-full text-xs', activeStep === step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>
                {index + 1}
              </span>
              {step}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderProjectStep() {
    return (
      <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        {[
          ['Quote title', 'projectName'],
          ['Client', 'clientName'],
          ['Site', 'siteName'],
          ['Location', 'location']
        ].map(([label, key]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={session[key as keyof EstimateSession] as string}
              onChange={(event) => patchSession(key as keyof EstimateSession, event.target.value as never)}
            />
          </label>
        ))}
      </article>
    );
  }

  function renderScopeStep() {
    return (
      <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Work Category
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={session.workCategoryCode}
            onChange={(event) => updateScope(event.target.value)}
          >
            {seedData.availableScopeChoices.map((category) => (
              <option key={category.workCategoryCode} value={category.workCategoryCode}>
                {category.workCategoryLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Scope Item
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={session.scopeItemCode}
            onChange={(event) => updateScope(session.workCategoryCode, event.target.value)}
          >
            {selectedCategory?.scopeItems.map((scope) => (
              <option key={scope.scopeItemCode} value={scope.scopeItemCode}>
                {scope.scopeItemLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Delivery Method
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={session.deliveryMethodCode}
            onChange={(event) => updateScope(session.workCategoryCode, session.scopeItemCode, event.target.value)}
          >
            {selectedScope?.availableDeliveryMethods.map((method) => (
              <option key={method.deliveryMethodCode} value={method.deliveryMethodCode}>
                {method.deliveryMethodLabel}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            Current path: <strong>{selectedCategory?.workCategoryLabel}</strong> → <strong>{selectedScope?.scopeItemLabel}</strong> →{' '}
            <strong>{selectedMethod?.deliveryMethodLabel}</strong>
          </p>
          <p className="mt-1">This controls which inputs and quote sections are shown.</p>
        </div>
      </article>
    );
  }

  function renderInputsStep() {
    return (
      <div className="space-y-4">
        {questionGroups.map((group) => (
          <article key={group.groupId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">{group.groupLabel}</h4>
                <p className="text-xs text-slate-500">{group.groupDescription}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{group.questions.length} inputs</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.questions.map((question) => {
                const isAdvanced = question.advancedFlag;
                return (
                  <label key={question.projectInputCode} className={cx('rounded-lg border p-3 text-sm', isAdvanced ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-white')}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{question.label}</span>
                      {isAdvanced && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Advanced</span>}
                    </div>
                    {question.options.length > 0 ? (
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                        value={answers[question.projectInputCode] ?? question.defaultValue}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [question.projectInputCode]: event.target.value }))}
                      >
                        <option value="">Select</option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                        placeholder={question.answerType}
                        value={answers[question.projectInputCode] ?? question.defaultValue}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [question.projectInputCode]: event.target.value }))}
                      />
                    )}
                    <p className="mt-1 text-xs text-slate-500">{question.helpText}</p>
                  </label>
                );
              })}
            </div>
          </article>
        ))}

        {controls.warnings.length > 0 && (
          <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <h4 className="font-semibold">Review signals from current answers</h4>
            <ul className="mt-2 space-y-1 text-amber-800">
              {controls.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </article>
        )}
      </div>
    );
  }

  function renderQuoteBuilderStep() {
    const groups: QuoteLine['section'][] = ['Base items', 'Conditional add-ons', 'Review Required', 'Quote Required'];

    return (
      <div className="space-y-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Quote metadata</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Quote #', 'quoteNumber'],
              ['Date raised', 'dateRaised'],
              ['Due date', 'dueDate'],
              ['Reference', 'reference'],
              ['Currency', 'currency'],
              ['Tax mode', 'taxMode']
            ].map(([label, key]) => (
              <label key={key} className="text-xs font-medium text-slate-700">
                {label}
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={quoteMeta[key as keyof typeof quoteMeta]}
                  onChange={(event) => setQuoteMeta((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Quote Builder</h4>
            <p className="text-xs text-slate-500">Structured quote composition with grouped line items.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const lines = quoteLines.filter((line) => line.section === group);
                  if (lines.length === 0) return null;
                  return (
                    <Fragment key={`group-${group}`}>
                      <tr className="bg-slate-100/70">
                        <td colSpan={6} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {group}
                        </td>
                      </tr>
                      {lines.map((line) => (
                        <tr key={line.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-800">{line.description}</td>
                          <td className="px-4 py-2 text-right text-slate-700">{line.quantity}</td>
                          <td className="px-4 py-2 text-slate-700">{line.unit}</td>
                          <td className="px-4 py-2 text-right text-slate-700">{line.rate}</td>
                          <td className="px-4 py-2 text-right font-medium text-slate-800">{line.amount}</td>
                          <td className="px-4 py-2">
                            <span
                              className={cx(
                                'rounded-full px-2 py-1 text-xs',
                                line.status === 'Included' && 'bg-emerald-100 text-emerald-700',
                                line.status === 'Conditional' && 'bg-indigo-100 text-indigo-700',
                                line.status === 'Review Required' && 'bg-amber-100 text-amber-700',
                                line.status === 'Quote Required' && 'bg-rose-100 text-rose-700'
                              )}
                            >
                              {line.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">+ Add line</button>
              <button className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">+ Add section</button>
            </div>
            <div className="justify-self-end text-sm">
              <div className="flex justify-between gap-12">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-800">{money(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-12">
                <span className="text-slate-500">GST</span>
                <span className="font-medium text-slate-800">{money(gst)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-12 border-t border-slate-300 pt-2 text-base">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="font-semibold text-slate-900">{money(total)}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  function renderReviewStep() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-semibold text-amber-900">Review Required</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {controls.reviewHolds.length === 0 ? <li>No review holds triggered.</li> : controls.reviewHolds.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </article>
        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h4 className="font-semibold text-rose-900">Quote Required</h4>
          <ul className="mt-2 space-y-1 text-sm text-rose-800">
            {summary.quoteRequiredItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </div>
    );
  }

  function renderNewQuoteWorkspace() {
    return (
      <div className="space-y-4">
        {renderStepRail()}
        {activeStep === 'Project' && renderProjectStep()}
        {activeStep === 'Scope' && renderScopeStep()}
        {activeStep === 'Inputs' && renderInputsStep()}
        {activeStep === 'Quote Builder' && renderQuoteBuilderStep()}
        {activeStep === 'Review' && renderReviewStep()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-[230px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 p-4 text-slate-100">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Civils</p>
            <h1 className="mt-1 text-lg font-semibold">Quote Workspace</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveNav(item)}
                className={cx(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                  activeNav === item ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="grid grid-cols-[1fr_340px]">
          <section className="p-6">
            <header className="mb-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{session.estimateId}</p>
                  <h2 className="text-xl font-semibold text-slate-900">{session.projectName}</h2>
                  <p className="text-sm text-slate-600">
                    {session.clientName} • {session.siteName} • {session.location} • Updated {humanDate(session.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">Save draft</button>
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">Validate</button>
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">Send for review</button>
                  <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white">Generate output</button>
                </div>
              </div>
            </header>

            {activeNav === 'Dashboard' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Draft Quotes', seedData.recentEstimates.filter((q) => q.status === 'Draft').length],
                    ['In Review', seedData.recentEstimates.filter((q) => q.status === 'In Review').length],
                    ['Ready', seedData.recentEstimates.filter((q) => q.status === 'Ready').length],
                    ['Quote Required', summary.quoteRequiredItems.length]
                  ].map(([label, value]) => (
                    <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold">{value}</p>
                    </article>
                  ))}
                </div>
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Recent Quotes</h3>
                    <button className="rounded-md bg-indigo-600 px-3 py-2 text-xs text-white" onClick={() => setActiveNav('New Quote')}>
                      New Quote
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2">Quote</th>
                        <th className="py-2">Client</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seedData.recentEstimates.map((quote) => (
                        <tr key={quote.estimateId} className="border-b border-slate-100">
                          <td className="py-2">{quote.projectName}</td>
                          <td className="py-2">{quote.clientName}</td>
                          <td className="py-2">{quote.status}</td>
                          <td className="py-2">{quote.reviewStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              </div>
            )}

            {activeNav === 'New Quote' && renderNewQuoteWorkspace()}

            {activeNav === 'Quotes' && (
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Quotes</h3>
                  <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Search quote or client" />
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2">Quote</th>
                      <th className="py-2">Client</th>
                      <th className="py-2">Scope</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seedData.recentEstimates.map((quote) => (
                      <tr key={quote.estimateId} className="border-b border-slate-100">
                        <td className="py-2">{quote.projectName}</td>
                        <td className="py-2">{quote.clientName}</td>
                        <td className="py-2">{selectedScope?.scopeItemLabel}</td>
                        <td className="py-2">{quote.status}</td>
                        <td className="py-2">
                          <button className="rounded border border-slate-300 px-2 py-1 text-xs">Open</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}

            {activeNav === 'Reviews' && (
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold">Review Queue</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2">Blocker Type</th>
                      <th className="py-2">Reason</th>
                      <th className="py-2">Next Action</th>
                      <th className="py-2">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.reviewHolds.map((reason, index) => (
                      <tr key={reason} className="border-b border-slate-100">
                        <td className="py-2">Review Required</td>
                        <td className="py-2">{reason}</td>
                        <td className="py-2">Operational reviewer to confirm scope path.</td>
                        <td className="py-2">{index < 2 ? 'High' : 'Medium'}</td>
                      </tr>
                    ))}
                    {summary.quoteRequiredItems.map((reason) => (
                      <tr key={reason} className="border-b border-slate-100">
                        <td className="py-2">Quote Required</td>
                        <td className="py-2">{reason}</td>
                        <td className="py-2">Supplier follow-up required before final issue.</td>
                        <td className="py-2">High</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}

            {activeNav === 'Outputs' && (
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-semibold">Internal Quote Preview</h3>
                  <p className="text-sm text-slate-600">{outputPreview.projectHeader}</p>
                  <p className="text-sm text-slate-500">{outputPreview.scopeSummary}</p>
                </div>
                <div className="mt-4 space-y-4">
                  {outputPreview.groupedLineItems.map((group) => (
                    <section key={group.group}>
                      <h4 className="text-sm font-semibold text-slate-700">{group.group}</h4>
                      <ul className="mt-1 space-y-1 text-sm text-slate-700">
                        {group.items.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </section>
                  ))}

                  <section>
                    <h4 className="text-sm font-semibold text-slate-700">Assumptions</h4>
                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                      {outputPreview.assumptions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-700">Exclusions</h4>
                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                      {outputPreview.exclusions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </article>
            )}

            {activeNav === 'Admin' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ['Rate Library', 'Managed rates and placeholders'],
                  ['Standard Items', 'Pit, slab, and support item library'],
                  ['Production Assumptions', 'Crew and productivity assumptions'],
                  ['Import and Mapping', 'Import status and mapping checkpoints'],
                  ['Audit and Gaps', 'Open gaps and audit outcomes']
                ].map(([title, subtitle]) => (
                  <article key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                    <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Read-only management preview</div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="sticky top-0 h-screen border-l border-slate-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quote Status</h3>
            <div className="mt-3 space-y-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-700">Scope Path</p>
                <p className="mt-1 text-slate-600">{outputPreview.scopeSummary}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-700">Validation State</p>
                <p className="mt-1 text-slate-600">{summary.readyState}</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium text-amber-900">Review Required</p>
                <ul className="mt-1 space-y-1 text-amber-800">
                  {controls.reviewHolds.length === 0 ? <li>None</li> : controls.reviewHolds.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="font-medium text-rose-900">Quote Required</p>
                <ul className="mt-1 space-y-1 text-rose-800">
                  {summary.quoteRequiredItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-700">Totals Snapshot</p>
                <div className="mt-1 text-slate-600">
                  <p>Subtotal: {money(subtotal)}</p>
                  <p>GST: {money(gst)}</p>
                  <p className="font-semibold text-slate-900">Total: {money(total)}</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
