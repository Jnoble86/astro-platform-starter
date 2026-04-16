import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Mode = 'site' | 'fleet';
type InstallType = 'wall' | 'fascia' | 'roof' | 'pole';
type Accessory = 'wall' | 'fascia' | 'pivot-roof' | 'pipe-pole' | 'custom-roof' | 'custom-pole';
type FleetScenario = 'scenario-1' | 'scenario-2' | 'scenario-3';

type LineItem = {
  label: string;
  amount?: number;
  detail?: string;
};

const money = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
});

const siteBaseInstallPrices: Record<InstallType, LineItem> = {
  wall: { label: 'Wall Mount Install', amount: 835.68 },
  fascia: { label: 'Fascia Mount Install', amount: 835.68 },
  roof: { label: 'Roof Mount Install', amount: 835.68 },
  pole: { label: 'Existing Pole / Mast / Unistrut Install', amount: 557.12 },
};

const accessoryOptions: Array<{ value: Accessory; label: string; amount?: number; quoteRequired?: boolean }> = [
  { value: 'wall', label: 'Standard Wall Mount', amount: 155 },
  { value: 'fascia', label: 'Standard Fascia Mount', amount: 155 },
  { value: 'pivot-roof', label: 'Standard Pivot Roof Mount', amount: 165 },
  { value: 'pipe-pole', label: 'Standard Pipe / Pole Adapter', amount: 105 },
  { value: 'custom-roof', label: 'Custom Roof Mount', quoteRequired: true },
  { value: 'custom-pole', label: 'Custom Pole / Adaptation Kit', quoteRequired: true },
];

const fleetScenarios: Array<{ value: FleetScenario; label: string; amount: number; detail?: string }> = [
  { value: 'scenario-1', label: 'Scenario 1 · Direct DC Fleet Install', amount: 1872.03 },
  { value: 'scenario-2', label: 'Scenario 2 · Fleet Install with Battery Backup', amount: 5102.8 },
  {
    value: 'scenario-3',
    label: 'Scenario 3 · Fleet Install with Supplementary Charging',
    amount: 6422.8,
    detail: 'Subject to selected equipment',
  },
];

function sectionCard(step: string, title: string, children: ReactNode, subtitle?: string) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-100 px-2 text-xs font-semibold text-sky-800">
          {step}
        </span>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-700">{label}</span>
      {right ? <span className="font-medium text-slate-900">{right}</span> : null}
    </div>
  );
}

export default function StarlinkJobOrder() {
  const [mode, setMode] = useState<Mode>('site');
  const [client, setClient] = useState('');
  const [reference, setReference] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [installType, setInstallType] = useState<InstallType>('wall');
  const [accessory, setAccessory] = useState<Accessory>('wall');
  const [ethernetAdaptor, setEthernetAdaptor] = useState(false);
  const [cable45m, setCable45m] = useState(false);

  const [includeSurvey, setIncludeSurvey] = useState(true);
  const [extraCableMetres, setExtraCableMetres] = useState(0);
  const [uvConduitMetres, setUvConduitMetres] = useState(0);
  const [additionalPenetrations, setAdditionalPenetrations] = useState(0);
  const [newGpo, setNewGpo] = useState(false);
  const [upsSupply, setUpsSupply] = useState(false);
  const [upsShelf, setUpsShelf] = useState(false);
  const [upsLabour, setUpsLabour] = useState(false);
  const [travelKm, setTravelKm] = useState(0);
  const [lafhaNights, setLafhaNights] = useState(0);

  const [projectLogistics, setProjectLogistics] = useState(false);
  const [fireRatedSealing, setFireRatedSealing] = useState(false);
  const [poleCivils, setPoleCivils] = useState(false);
  const [ewpAccess, setEwpAccess] = useState(false);
  const [groundsMaintenance, setGroundsMaintenance] = useState(false);

  const [fleetScenario, setFleetScenario] = useState<FleetScenario>('scenario-1');
  const [fleetArchitecture, setFleetArchitecture] = useState(false);
  const [fleetVehicleAdaptation, setFleetVehicleAdaptation] = useState(false);
  const [fleetFieldInstall, setFleetFieldInstall] = useState(false);

  const [priceFlash, setPriceFlash] = useState(false);
  const [showResultMoment, setShowResultMoment] = useState(false);
  const [showReviewConditions, setShowReviewConditions] = useState(false);
  const pricePanelRef = useRef<HTMLElement | null>(null);

  const pricing = useMemo(() => {
    const baseInstall: LineItem[] = [];
    const addOns: LineItem[] = [];
    const included: LineItem[] = [];
    const quoteRequired: LineItem[] = [];

    if (mode === 'site') {
      if (includeSurvey) {
        baseInstall.push({ label: 'Site Survey', amount: 348.2 });
      }
      baseInstall.push(siteBaseInstallPrices[installType]);

      const selectedAccessory = accessoryOptions.find((option) => option.value === accessory);
      if (selectedAccessory?.quoteRequired) {
        quoteRequired.push({ label: selectedAccessory.label });
      } else if (selectedAccessory?.amount) {
        addOns.push({ label: selectedAccessory.label, amount: selectedAccessory.amount });
      }

      if (ethernetAdaptor) addOns.push({ label: 'Ethernet Adaptor', amount: 60 });
      if (cable45m) addOns.push({ label: '45 m Cable', amount: 230 });
      if (extraCableMetres > 0)
        addOns.push({ label: `Additional Cable Route Over 15 m × ${extraCableMetres} m`, amount: 23.21 * extraCableMetres });
      if (uvConduitMetres > 0)
        addOns.push({ label: `Additional UV Conduit Over 2 m × ${uvConduitMetres} m`, amount: 28.86 * uvConduitMetres });
      if (additionalPenetrations > 0)
        addOns.push({
          label: `Additional Standard Minor Penetration × ${additionalPenetrations}`,
          amount: 184.28 * additionalPenetrations,
        });
      if (newGpo) addOns.push({ label: 'New GPO Installation', amount: 398.56 });
      if (upsSupply) addOns.push({ label: 'UPS Supply', amount: 849 });
      if (upsShelf) addOns.push({ label: 'UPS Shelf / Tray', amount: 46.43 });
      if (upsLabour) addOns.push({ label: 'UPS Install Labour', amount: 139.28 });
      if (travelKm > 0) addOns.push({ label: `Additional Travel × ${travelKm} km`, amount: travelKm * 1.75 });
      if (lafhaNights > 0) addOns.push({ label: `LAFHA × ${lafhaNights} night${lafhaNights > 1 ? 's' : ''}`, amount: lafhaNights * 350 });

      if (projectLogistics) quoteRequired.push({ label: 'Project logistics' });
      if (fireRatedSealing) quoteRequired.push({ label: 'Fire-rated sealing' });
      if (poleCivils) quoteRequired.push({ label: 'Pole civils / new pole' });
      if (ewpAccess) quoteRequired.push({ label: 'Non-standard access / EWP' });
      if (groundsMaintenance) quoteRequired.push({ label: 'Minor grounds maintenance' });

      included.push({ label: 'Compound Condition Report', amount: 0 });
      included.push({ label: 'Battery Condition Report', amount: 0 });
      included.push({ label: 'Internal Shelter Condition Report', amount: 0 });
    } else {
      const selectedScenario = fleetScenarios.find((scenario) => scenario.value === fleetScenario)!;
      baseInstall.push({ label: selectedScenario.label, amount: selectedScenario.amount, detail: selectedScenario.detail });

      if (fleetArchitecture) quoteRequired.push({ label: '240V architecture / inverter' });
      if (fleetVehicleAdaptation) quoteRequired.push({ label: 'Vehicle-specific adaptation' });
      if (fleetFieldInstall) quoteRequired.push({ label: 'Field install / mobile attendance' });
    }

    const subtotal = [...baseInstall, ...addOns].reduce((acc, item) => acc + (item.amount ?? 0), 0);

    return { baseInstall, addOns, included, quoteRequired, subtotal };
  }, [
    accessory,
    additionalPenetrations,
    cable45m,
    ethernetAdaptor,
    ewpAccess,
    extraCableMetres,
    fireRatedSealing,
    fleetArchitecture,
    fleetFieldInstall,
    fleetScenario,
    fleetVehicleAdaptation,
    groundsMaintenance,
    includeSurvey,
    installType,
    lafhaNights,
    mode,
    newGpo,
    poleCivils,
    projectLogistics,
    travelKm,
    upsLabour,
    upsShelf,
    upsSupply,
    uvConduitMetres,
  ]);

  const narrativeSummary =
    mode === 'site'
      ? 'This indicative price shows a survey-first site installation with the selected mounting and accessory basis. Base install, add-ons and items that need review are shown separately.'
      : 'This indicative price shows the selected fleet package. Any non-standard vehicle architecture, vehicle-specific adaptation or field install requirement is shown separately as quote required.';

  useEffect(() => {
    setPriceFlash(true);
    const timer = window.setTimeout(() => setPriceFlash(false), 650);
    return () => window.clearTimeout(timer);
  }, [pricing.subtotal, mode, pricing.quoteRequired.length, pricing.addOns.length]);

  useEffect(() => {
    if (projectLogistics || fireRatedSealing || poleCivils || ewpAccess || groundsMaintenance) {
      setShowReviewConditions(true);
    }
  }, [projectLogistics, fireRatedSealing, poleCivils, ewpAccess, groundsMaintenance]);

  const copySummary = async () => {
    const lines = [
      'Starlink Job Order',
      '',
      `Client: ${client || '—'}`,
      `Job reference / site name: ${reference || '—'}`,
      location ? `Suburb / postcode: ${location}` : null,
      '',
      narrativeSummary,
      '',
      'Base install',
      ...pricing.baseInstall.map((item) => `- ${item.label}${item.amount ? `: ${money.format(item.amount)}` : ''}${item.detail ? ` (${item.detail})` : ''}`),
      '',
      'Add-ons',
      ...(pricing.addOns.length
        ? pricing.addOns.map((item) => `- ${item.label}${item.amount ? `: ${money.format(item.amount)}` : ''}`)
        : ['- None selected']),
      ...(mode === 'site'
        ? [
            '',
            'Included at no additional charge',
            ...pricing.included.map((item) => `- ${item.label}: ${money.format(item.amount ?? 0)}`),
          ]
        : []),
      '',
      'Quote required',
      ...(pricing.quoteRequired.length ? pricing.quoteRequired.map((item) => `- ${item.label}`) : ['- None']),
      '',
      `Indicative subtotal excl. GST: ${money.format(pricing.subtotal)}`,
    ].filter(Boolean);

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-7 rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Indicative client order view</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Starlink Installation Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Choose scope, then review the indicative price instantly.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.88fr]">
          <div className="space-y-6">
            {sectionCard('1', 'Choose order mode', (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    mode === 'site'
                      ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-900 shadow-sm ring-2 ring-sky-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => setMode('site')}
                >
                  Site install
                </button>
                <button
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    mode === 'fleet'
                      ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-900 shadow-sm ring-2 ring-sky-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => setMode('fleet')}
                >
                  Fleet install
                </button>
              </div>
            ), 'Start by choosing the installation mode.')}

            {mode === 'site' ? (
                <div key="site" className="transition-opacity duration-200">
                  <div className="space-y-5">
                    {sectionCard('2', 'Choose install type', (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {([
                          ['wall', 'Wall mount'],
                          ['fascia', 'Fascia mount'],
                          ['roof', 'Roof mount'],
                          ['pole', 'Existing pole / mast / unistrut'],
                        ] as const).map(([value, label]) => (
                          <label
                            key={value}
                            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-sm transition ${
                              installType === value
                                ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-900 ring-2 ring-sky-100 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-800">{label}</span>
                              <input type="radio" name="installType" checked={installType === value} onChange={() => setInstallType(value)} />
                            </div>
                            <span className="mt-3 text-xs text-slate-500">Base install option</span>
                          </label>
                        ))}
                      </div>
                    ))}

                    {sectionCard('3', 'Choose mounting accessory', (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {accessoryOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-sm transition ${
                              accessory === option.value
                                ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-800">{option.label}</span>
                              <input
                                type="radio"
                                name="accessory"
                                checked={accessory === option.value}
                                onChange={() => setAccessory(option.value)}
                                className="mt-0.5"
                              />
                            </div>
                            <p
                              className={`mt-3 inline-flex w-fit rounded-full px-2 py-1 text-xs ${
                                option.quoteRequired ? 'bg-amber-50 font-medium text-amber-700' : 'bg-slate-100 font-semibold text-slate-700'
                              }`}
                            >
                              {option.quoteRequired ? 'Quote required' : money.format(option.amount ?? 0)}
                            </p>
                          </label>
                        ))}
                      </div>
                    ), 'Choose the mounting accessory basis for this job.')}

                    {sectionCard('4', 'Optional hardware and site conditions', (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-slate-300">
                            <span>Ethernet Adaptor</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">$60.00</span>
                              <input type="checkbox" checked={ethernetAdaptor} onChange={(e) => setEthernetAdaptor(e.target.checked)} />
                            </div>
                          </label>
                          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-slate-300">
                            <span>45 m Cable</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">$230.00</span>
                              <input type="checkbox" checked={cable45m} onChange={(e) => setCable45m(e.target.checked)} />
                            </div>
                          </label>
                        </div>
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common add-ons</p>
                          <label className="flex items-center justify-between text-sm">
                            <span>Include mandatory survey</span>
                            <input type="checkbox" checked={includeSurvey} onChange={(e) => setIncludeSurvey(e.target.checked)} />
                          </label>

                          {[
                            ['New GPO', newGpo, setNewGpo],
                            ['UPS supply', upsSupply, setUpsSupply],
                            ['UPS shelf / tray', upsShelf, setUpsShelf],
                            ['UPS install labour', upsLabour, setUpsLabour],
                          ].map(([label, checked, setter]) => (
                            <label key={label as string} className="flex items-center justify-between text-sm">
                              <span>{label as string}</span>
                              <input type="checkbox" checked={checked as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                            </label>
                          ))}

                          <details className="rounded-lg border border-slate-200 bg-white p-2">
                            <summary className="cursor-pointer px-1 py-0.5 text-sm font-medium text-slate-700">Adjust quantities (advanced)</summary>
                            <div className="mt-2 space-y-2 px-1 pb-1">
                              {[
                                ['Extra cable route over 15 m', extraCableMetres, setExtraCableMetres],
                                ['Additional UV conduit over 2 m', uvConduitMetres, setUvConduitMetres],
                                ['Additional standard penetrations', additionalPenetrations, setAdditionalPenetrations],
                                ['Additional travel km', travelKm, setTravelKm],
                                ['LAFHA nights', lafhaNights, setLafhaNights],
                              ].map(([label, value, setter]) => (
                                <label key={label as string} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                                  <span>{label as string}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={value as number}
                                    onChange={(e) => (setter as (n: number) => void)(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-right"
                                  />
                                </label>
                              ))}
                            </div>
                          </details>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700"
                            onClick={() => setShowReviewConditions((current) => !current)}
                          >
                            Conditions needing review
                            <span className="text-xs text-slate-500">{showReviewConditions ? 'Hide' : 'Show'}</span>
                          </button>
                          {showReviewConditions ? (
                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                              {[
                                ['Project logistics', projectLogistics, setProjectLogistics],
                                ['Fire-rated sealing', fireRatedSealing, setFireRatedSealing],
                                ['Pole civils / new pole', poleCivils, setPoleCivils],
                                ['Non-standard access / EWP', ewpAccess, setEwpAccess],
                                ['Minor grounds maintenance', groundsMaintenance, setGroundsMaintenance],
                              ].map(([label, checked, setter]) => (
                                <label key={label as string} className="flex items-center justify-between">
                                  <span>{label as string}</span>
                                  <input
                                    type="checkbox"
                                    checked={checked as boolean}
                                    onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                                  />
                                </label>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ), 'Add standard requirements first, then expand review conditions if needed.')}
                  </div>
                </div>
              ) : (
                <div key="fleet" className="transition-opacity duration-200">
                  <div className="space-y-5">
                    {sectionCard('2', 'Choose fleet package', (
                      <div className="space-y-2">
                        {fleetScenarios.map((option) => (
                          <label key={option.value} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <div>
                              <p>{option.label}</p>
                              {option.detail ? <p className="text-xs text-slate-500">{option.detail}</p> : null}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">{money.format(option.amount)}</span>
                              <input
                                type="radio"
                                name="fleetScenario"
                                checked={fleetScenario === option.value}
                                onChange={() => setFleetScenario(option.value)}
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    ), 'Solar panel supply excluded.')}

                    {sectionCard('3', 'Conditions needing review', (
                      <div className="space-y-2">
                        {[
                          ['240V architecture / inverter', fleetArchitecture, setFleetArchitecture],
                          ['Vehicle-specific adaptation', fleetVehicleAdaptation, setFleetVehicleAdaptation],
                          ['Field install / mobile attendance', fleetFieldInstall, setFleetFieldInstall],
                        ].map(([label, checked, setter]) => (
                          <label key={label as string} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <span>{label as string}</span>
                            <input type="checkbox" checked={checked as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                          </label>
                        ))}
                      </div>
                    ))}

                    <p className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs leading-relaxed text-slate-700">
                      Standard fleet basis uses Starlink Mini direct-DC with a workshop-presented vehicle, suitable roof racks already fitted,
                      no customer-supplied equipment, and no major fabrication or bespoke vehicle modification in the base package.
                    </p>
                  </div>
                </div>
              )}

            {sectionCard(mode === 'site' ? '5' : '4', 'Job details (optional)', (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm sm:col-span-1">
                  <span className="text-slate-600">Client</span>
                  <input value={client} onChange={(e) => setClient(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                </label>
                <label className="space-y-1 text-sm sm:col-span-1">
                  <span className="text-slate-600">Job reference / site name</span>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                </label>
                <label className="space-y-1 text-sm sm:col-span-1">
                  <span className="text-slate-600">Suburb / postcode</span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-slate-600">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            ), 'Add client details now or leave blank for early scope review.')}
          </div>

          <aside className="xl:sticky xl:top-6 xl:h-fit">
            <section
              ref={pricePanelRef}
              className={`rounded-2xl border bg-white p-5 shadow-sm shadow-slate-200/60 transition-all duration-500 ${
                priceFlash ? 'border-sky-300 shadow-sky-100 ring-4 ring-sky-100/80' : 'border-slate-200'
              }`}
            >
              <h2 className="text-xl font-semibold tracking-tight">Indicative Price</h2>
              {showResultMoment ? (
                <p className="mt-2 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                  Price summary updated
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-600">{client || 'Client'} · {reference || 'Job reference / site name'}</p>
              {location ? <p className="text-sm text-slate-600">{location}</p> : null}
              {notes ? <p className="mt-2 text-sm text-slate-600">{notes}</p> : null}

              <p className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-sm leading-relaxed text-slate-700">
                {narrativeSummary}
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Base install</h3>
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {pricing.baseInstall.map((item) => (
                      <Row
                        key={item.label}
                        label={`${item.label}${item.detail ? ` (${item.detail})` : ''}`}
                        right={item.amount !== undefined ? money.format(item.amount) : undefined}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Add-ons</h3>
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {pricing.addOns.length ? pricing.addOns.map((item) => <Row key={item.label} label={item.label} right={money.format(item.amount ?? 0)} />) : <Row label="None selected" />}
                  </div>
                </div>

                {mode === 'site' ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Included at no additional charge</h3>
                    <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      {pricing.included.map((item) => (
                        <Row key={item.label} label={item.label} right={money.format(item.amount ?? 0)} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Quote required</h3>
                  <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    {pricing.quoteRequired.length ? pricing.quoteRequired.map((item) => <Row key={item.label} label={item.label} />) : <Row label="None" />}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-100 to-cyan-100 p-5 shadow-sm shadow-sky-200/50">
                <p className="text-sm text-slate-600">Indicative subtotal excl. GST</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">{money.format(pricing.subtotal)}</p>
              </div>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setShowResultMoment(true);
                    setPriceFlash(true);
                    pricePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.setTimeout(() => {
                      setPriceFlash(false);
                      setShowResultMoment(false);
                    }, 900);
                  }}
                  className="rounded-xl bg-gradient-to-r from-sky-700 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-300/40 transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-800 hover:to-cyan-800"
                >
                  Show me my price
                </button>
                <button
                  onClick={copySummary}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  Copy client summary
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
