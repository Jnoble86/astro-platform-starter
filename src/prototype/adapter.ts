import { sourceData } from './sourceData';
import type {
  ActiveQuestionGroup,
  AdapterModel,
  EstimateSession,
} from './types';

const defaultGroupOrder = [
  'Site and context',
  'Surface and excavation',
  'Asset protection and proving',
  'Material and structure details',
  'Reinstatement',
  'Special conditions',
] as const;

function groupForQuestion(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('surface') || lower.includes('excavat')) return 'Surface and excavation';
  if (lower.includes('asset') || lower.includes('proving') || lower.includes('2 metres')) return 'Asset protection and proving';
  if (lower.includes('riser') || lower.includes('pit') || lower.includes('separator')) return 'Material and structure details';
  if (lower.includes('reinstate')) return 'Reinstatement';
  if (lower.includes('water')) return 'Special conditions';
  return 'Site and context';
}

export function buildAdapterModel(
  estimateSession: EstimateSession,
  answers: Record<string, string>,
): AdapterModel {
  const availableScopeChoices = sourceData.workCategories.map((wc) => ({
    workCategoryCode: wc.code,
    workCategoryLabel: wc.label,
    scopeItems: sourceData.scopeItems
      .filter((si) => si.workCategoryCode === wc.code)
      .map((si) => ({
        scopeItemCode: si.code,
        scopeItemLabel: si.label,
        description: si.description,
        defaultUnit: si.defaultUnit,
        availableDeliveryMethods: sourceData.deliveryMethods
          .filter((dm) => dm.scopeItemCode === si.code)
          .map((dm) => ({
            deliveryMethodCode: dm.code,
            deliveryMethodLabel: dm.label,
            methodType: dm.methodType,
            isDefault: dm.isDefault,
          })),
      })),
  }));

  const filteredQuestions = sourceData.projectInputs.filter(
    (pi) =>
      pi.scopeItemCode === estimateSession.scopeItemCode &&
      pi.deliveryMethodCode === estimateSession.deliveryMethodCode,
  );

  const activeQuestionGroups: ActiveQuestionGroup[] = defaultGroupOrder
    .map((name, i) => ({
      groupId: `grp-${i + 1}`,
      groupLabel: name,
      groupDescription: `${name} inputs for this scope path`,
      displayOrder: i + 1,
      questions: filteredQuestions
        .filter((q) => groupForQuestion(q.label) === name)
        .map((q) => ({
          projectInputCode: q.code,
          label: q.label,
          helpText: 'Answer based on site conditions and delivery pathway.',
          answerType: q.answerType,
          unit: q.answerType === 'whole number' ? 'count' : '',
          required: q.required,
          defaultValue: q.answerType === 'yes/no' ? 'no' : '',
          options: sourceData.inputOptions
            .filter((o) => o.projectInputCode === q.code)
            .map((o) => ({ label: o.label, value: o.value })),
          visibilityRule: 'Visible when selected scope path matches',
          advancedFlag: q.label.toLowerCase().includes('separator'),
        })),
    }))
    .filter((g) => g.questions.length > 0);

  const selectedScopeItem = sourceData.scopeItems.find((s) => s.code === estimateSession.scopeItemCode);
  const selectedMethod = sourceData.deliveryMethods.find((d) => d.code === estimateSession.deliveryMethodCode);

  const assetsNear = Object.entries(answers).some(
    ([k, v]) => k.toLowerCase().includes('a2m') && v.toLowerCase() === 'yes',
  );
  const riserRequired = Object.entries(answers).some(
    ([k, v]) => k.toLowerCase().includes('ris') && v.toLowerCase() === 'yes',
  );
  const separatorRequired = Object.entries(answers).some(
    ([k, v]) => k.toLowerCase().includes('sep') && v.toLowerCase() === 'yes',
  );

  const quoteRequiredItems = [
    ...(riserRequired ? ['Concrete pit risers', 'Concrete pit lid and frame library'] : []),
    ...(separatorRequired ? ['Geotextile / separator layer'] : []),
  ];

  const reviewHolds = assetsNear
    ? [sourceData.reviewHolds[1].message]
    : [];

  const warnings = assetsNear
    ? [sourceData.extraCostTriggers[0].message, sourceData.extraCostTriggers[1].message]
    : [];

  const readyState = quoteRequiredItems.length || reviewHolds.length ? 'Review Required' : 'Ready';

  const estimateSummary = {
    baseItems: [selectedScopeItem?.label ?? 'Select scope item', selectedMethod?.label ?? 'Select delivery method'],
    addOns: assetsNear ? ['Asset proving and protection controls'] : [],
    reviewItems: reviewHolds,
    quoteRequiredItems,
    assumptions: sourceData.assumptions,
    exclusions: sourceData.exclusions,
    totals: {
      lineItemCount: 2 + (assetsNear ? 1 : 0),
      indicativeRange: assetsNear ? '$12,000 - $18,000' : '$8,000 - $12,000',
    },
    readyState,
  } as const;

  const triggeredControls = {
    reviewHolds,
    extraCostTriggers: warnings,
    quoteRequiredItems,
    warnings,
    blockers: quoteRequiredItems.map((q) => `${q} remains quote-dependent and unresolved.`),
  };

  const outputPreviewModel = {
    projectHeader: `${estimateSession.projectName || 'Untitled Project'} · ${estimateSession.clientName || 'Client TBC'}`,
    scopeSummary: `${selectedScopeItem?.label ?? 'Scope not selected'} via ${selectedMethod?.label ?? 'method not selected'}`,
    groupedLineItems: [
      { group: 'Core scope', items: estimateSummary.baseItems },
      { group: 'Controls and add-ons', items: estimateSummary.addOns.length ? estimateSummary.addOns : ['No add-ons triggered'] },
    ],
    assumptions: estimateSummary.assumptions,
    exclusions: estimateSummary.exclusions,
    reviewNotes: reviewHolds,
    quoteRequiredNotes: quoteRequiredItems,
    footerStatus: readyState === 'Ready' ? 'Ready for output' : 'Needs review before output',
  };

  return {
    estimateSession,
    availableScopeChoices,
    activeQuestionGroups,
    estimateSummary,
    triggeredControls,
    outputPreviewModel,
  };
}
