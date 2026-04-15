import type { CsvRow } from './csvAdapter';

export type EstimateSession = {
  estimateId: string;
  projectName: string;
  clientName: string;
  siteName: string;
  location: string;
  workCategoryCode: string;
  scopeItemCode: string;
  deliveryMethodCode: string;
  status: 'Draft' | 'In Review' | 'Ready';
  reviewStatus: 'Clear' | 'Needs review';
  quoteRequiredStatus: 'Clear' | 'Quote follow-up';
  createdAt: string;
  updatedAt: string;
};

export type AvailableScopeChoices = {
  workCategoryCode: string;
  workCategoryLabel: string;
  scopeItems: {
    scopeItemCode: string;
    scopeItemLabel: string;
    description: string;
    defaultUnit: string;
    availableDeliveryMethods: {
      deliveryMethodCode: string;
      deliveryMethodLabel: string;
      methodType: string;
      isDefault: boolean;
    }[];
  }[];
}[];

export type Question = {
  projectInputCode: string;
  label: string;
  helpText: string;
  answerType: string;
  unit: string;
  required: boolean;
  defaultValue: string;
  options: string[];
  visibilityRule: string;
  advancedFlag: boolean;
};

export type ActiveQuestionGroup = {
  groupId: string;
  groupLabel: string;
  groupDescription: string;
  displayOrder: number;
  questions: Question[];
};

export type TriggeredControls = {
  reviewHolds: string[];
  extraCostTriggers: string[];
  quoteRequiredItems: string[];
  warnings: string[];
  blockers: string[];
};

export type EstimateSummary = {
  baseItems: string[];
  addOns: string[];
  reviewItems: string[];
  quoteRequiredItems: string[];
  assumptions: string[];
  exclusions: string[];
  totals: {
    baseCount: number;
    addOnCount: number;
    unresolvedCount: number;
  };
  readyState: 'Draft' | 'Needs review' | 'Quote required' | 'Ready';
};

export type OutputPreviewModel = {
  projectHeader: string;
  scopeSummary: string;
  groupedLineItems: { group: string; items: string[] }[];
  assumptions: string[];
  exclusions: string[];
  reviewNotes: string[];
  quoteRequiredNotes: string[];
  footerStatus: string;
};

export type PrototypeSeedData = {
  estimateSession: EstimateSession;
  availableScopeChoices: AvailableScopeChoices;
  questionBank: Record<string, ActiveQuestionGroup[]>;
  scopeBuildMap: CsvRow[];
  costComponents: Record<string, CsvRow>;
  reviewHolds: CsvRow[];
  extraCostTriggers: CsvRow[];
  quoteRequiredItems: CsvRow[];
  recentEstimates: EstimateSession[];
};

function unique<T>(list: T[]): T[] {
  return [...new Set(list)];
}

function parseBoolean(value: string): boolean {
  return ['true', 'yes', '1'].includes((value || '').toLowerCase());
}

export function computeTriggeredControls(seed: PrototypeSeedData, session: EstimateSession): TriggeredControls {
  const quoteItems = seed.quoteRequiredItems.map((row) => row['missing_function']);

  const reviewRows = seed.reviewHolds.filter((row) => {
    const applies = row['Applies To'] || '';
    return applies.includes(session.scopeItemCode) || applies.includes(session.deliveryMethodCode);
  });

  const triggerRows = seed.extraCostTriggers.filter((row) => {
    const applies = row['Applies To'] || '';
    return applies.includes(session.scopeItemCode) || applies.includes(session.deliveryMethodCode) || applies.includes('all civils');
  });

  const blockers = reviewRows.filter((row) => parseBoolean(row['Blocks Issue Ready'] || '')).map((row) => row['Review Hold Name']);

  return {
    reviewHolds: reviewRows.map((row) => row['Review Hold Name']),
    extraCostTriggers: triggerRows.map((row) => row['Trigger Name']),
    quoteRequiredItems: quoteItems,
    warnings: unique([
      ...reviewRows.map((row) => row['Review Outcome Summary']).filter(Boolean),
      ...triggerRows.map((row) => row['Pricing Outcome Summary']).filter(Boolean)
    ]),
    blockers
  };
}

export function computeEstimateSummary(seed: PrototypeSeedData, session: EstimateSession): EstimateSummary {
  const rows = seed.scopeBuildMap.filter(
    (row) => row['Scope Item Code'] === session.scopeItemCode && row['Delivery Method Code'] === session.deliveryMethodCode
  );

  const baseItems = rows
    .filter((row) => row['Included by Default'] === 'Yes')
    .map((row) => seed.costComponents[row['Cost Component Code']]?.['Cost Component Name'] ?? row['Cost Component Code']);

  const addOns = rows
    .filter((row) => row['Included by Default'] !== 'Yes')
    .map((row) => seed.costComponents[row['Cost Component Code']]?.['Cost Component Name'] ?? row['Cost Component Code']);

  const controls = computeTriggeredControls(seed, session);

  const readyState: EstimateSummary['readyState'] = controls.blockers.length
    ? 'Needs review'
    : controls.quoteRequiredItems.length
      ? 'Quote required'
      : 'Ready';

  return {
    baseItems: unique(baseItems),
    addOns: unique(addOns),
    reviewItems: controls.reviewHolds,
    quoteRequiredItems: controls.quoteRequiredItems,
    assumptions: ['Productivity assumptions are read-only in this prototype.', 'Proving and brownfield rules remain enforced where applicable.'],
    exclusions: ['Commercial markup and recovery adjustments are not editable in prototype mode.'],
    totals: {
      baseCount: unique(baseItems).length,
      addOnCount: unique(addOns).length,
      unresolvedCount: controls.blockers.length + controls.quoteRequiredItems.length
    },
    readyState
  };
}

export function computeOutputPreviewModel(seed: PrototypeSeedData, session: EstimateSession): OutputPreviewModel {
  const summary = computeEstimateSummary(seed, session);
  const choices = seed.availableScopeChoices.find((choice) => choice.workCategoryCode === session.workCategoryCode);
  const scope = choices?.scopeItems.find((item) => item.scopeItemCode === session.scopeItemCode);
  const method = scope?.availableDeliveryMethods.find((item) => item.deliveryMethodCode === session.deliveryMethodCode);

  return {
    projectHeader: `${session.projectName} — ${session.clientName}`,
    scopeSummary: `${choices?.workCategoryLabel ?? session.workCategoryCode} / ${scope?.scopeItemLabel ?? session.scopeItemCode} / ${method?.deliveryMethodLabel ?? session.deliveryMethodCode}`,
    groupedLineItems: [
      { group: 'Base items', items: summary.baseItems },
      { group: 'Conditional add-ons', items: summary.addOns }
    ],
    assumptions: summary.assumptions,
    exclusions: summary.exclusions,
    reviewNotes: summary.reviewItems,
    quoteRequiredNotes: summary.quoteRequiredItems,
    footerStatus: summary.readyState
  };
}
