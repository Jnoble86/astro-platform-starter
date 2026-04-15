import type { CsvRow } from './csvAdapter';
import { readCsvFromRepoRoot } from './csvAdapter';
import type { ActiveQuestionGroup, AvailableScopeChoices, EstimateSession, PrototypeSeedData, Question } from './prototypeAdapter';

const GROUP_ORDER = [
  'Site and context',
  'Surface and excavation',
  'Asset protection and proving',
  'Material and structure details',
  'Reinstatement',
  'Special conditions'
] as const;

function unique<T>(list: T[]): T[] {
  return [...new Set(list)];
}

function parseBoolean(value: string): boolean {
  return ['true', 'yes', '1'].includes((value || '').toLowerCase());
}

function safeLabel(code: string, name: string): string {
  return name?.trim() || code.replace(/^\w+-?/, '').replace(/[-_]/g, ' ');
}

function detectGroup(inputText: string): (typeof GROUP_ORDER)[number] {
  const text = inputText.toLowerCase();

  if (text.includes('asset') || text.includes('proving') || text.includes('2 metre')) {
    return 'Asset protection and proving';
  }
  if (text.includes('surface') || text.includes('breakout') || text.includes('excavat')) {
    return 'Surface and excavation';
  }
  if (text.includes('reinstat')) {
    return 'Reinstatement';
  }
  if (text.includes('pit') || text.includes('slab') || text.includes('conduit') || text.includes('entry')) {
    return 'Material and structure details';
  }
  if (text.includes('abnormal') || text.includes('water') || text.includes('review')) {
    return 'Special conditions';
  }

  return 'Site and context';
}

function mapQuestionGroups(projectInputs: CsvRow[], inputOptions: CsvRow[]): Record<string, ActiveQuestionGroup[]> {
  const optionsByInput = inputOptions.reduce<Record<string, string[]>>((acc, row) => {
    const code = row['Project Input Code'];
    if (!acc[code]) acc[code] = [];
    acc[code].push(row['Option Label']);
    return acc;
  }, {});

  const groupedByPath: Record<string, Record<string, Question[]>> = {};

  projectInputs.forEach((row) => {
    const scopeItemCode = row['Scope Item Code'];
    const deliveryMethodCode = row['Delivery Method Code'];
    const pathKey = `${scopeItemCode}::${deliveryMethodCode}`;

    if (!groupedByPath[pathKey]) {
      groupedByPath[pathKey] = {};
      GROUP_ORDER.forEach((group) => {
        groupedByPath[pathKey][group] = [];
      });
    }

    const groupLabel = detectGroup(row['Project Input Text']);

    groupedByPath[pathKey][groupLabel].push({
      projectInputCode: row['Project Input Code'],
      label: row['Project Input Text'],
      helpText: row['Conditional On Summary'] === 'none' ? 'Answer to continue estimate build.' : `Shown when ${row['Conditional On Summary']}.`,
      answerType: row['Answer Type'],
      unit: row['Unit'] || '',
      required: parseBoolean(row['Required']),
      defaultValue: row['Answer Type'] === 'yes/no' ? 'No' : '',
      options: unique(optionsByInput[row['Project Input Code']] ?? []),
      visibilityRule: row['Conditional On Summary'],
      advancedFlag: row['Blocks Pricing if Missing'] !== 'True' && row['Required'] !== 'True'
    });
  });

  const result: Record<string, ActiveQuestionGroup[]> = {};

  Object.entries(groupedByPath).forEach(([pathKey, groups]) => {
    result[pathKey] = GROUP_ORDER.map((label, idx) => ({
      groupId: `${pathKey}::${idx + 1}`,
      groupLabel: label,
      groupDescription: `${label} controls for this scope path.`,
      displayOrder: idx + 1,
      questions: groups[label]
    })).filter((group) => group.questions.length > 0);
  });

  return result;
}

export async function loadPrototypeSeedData(): Promise<PrototypeSeedData> {
  const [
    workCategories,
    scopeItems,
    deliveryMethods,
    scopeBuildMap,
    costComponents,
    projectInputs,
    inputOptions,
    reviewHolds,
    extraCostTriggers,
    quoteRequiredItems
  ] = await Promise.all([
    readCsvFromRepoRoot('Work_Categories.csv'),
    readCsvFromRepoRoot('Scope_Items.csv'),
    readCsvFromRepoRoot('Delivery_Methods.csv'),
    readCsvFromRepoRoot('Scope_Build_Map.csv'),
    readCsvFromRepoRoot('Cost_Components.csv'),
    readCsvFromRepoRoot('Project_Inputs.csv'),
    readCsvFromRepoRoot('Input_Options.csv'),
    readCsvFromRepoRoot('Review_Holds.csv'),
    readCsvFromRepoRoot('Extra_Cost_Triggers.csv'),
    readCsvFromRepoRoot('Quote_Required_Items.csv')
  ]);

  const scopesByCategory = scopeItems.reduce<Record<string, CsvRow[]>>((acc, row) => {
    const code = row['Work Category Code'];
    if (!acc[code]) acc[code] = [];
    acc[code].push(row);
    return acc;
  }, {});

  const methodsByScope = deliveryMethods.reduce<Record<string, CsvRow[]>>((acc, row) => {
    const code = row['Scope Item Code'];
    if (!acc[code]) acc[code] = [];
    acc[code].push(row);
    return acc;
  }, {});

  const availableScopeChoices: AvailableScopeChoices = workCategories
    .filter((row) => row['Active'] === 'True')
    .map((category) => ({
      workCategoryCode: category['Work Category Code'],
      workCategoryLabel: safeLabel(category['Work Category Code'], category['Work Category Name']),
      scopeItems: (scopesByCategory[category['Work Category Code']] ?? [])
        .filter((item) => item['Active'] === 'True')
        .map((item) => ({
          scopeItemCode: item['Scope Item Code'],
          scopeItemLabel: safeLabel(item['Scope Item Code'], item['Scope Item Name']),
          description: item['Notes'] || item['Scope Item Type'] || 'Civil work scope item',
          defaultUnit: item['Pricing Unit'] || 'item',
          availableDeliveryMethods: (methodsByScope[item['Scope Item Code']] ?? [])
            .filter((method) => method['Active'] === 'True')
            .map((method) => ({
              deliveryMethodCode: method['Delivery Method Code'],
              deliveryMethodLabel: safeLabel(method['Delivery Method Code'], method['Delivery Method Name']),
              methodType: method['Trigger Type'] || 'Standard',
              isDefault: method['Default Method'] === 'Yes'
            }))
        }))
    }))
    .filter((category) => category.scopeItems.length > 0);

  const firstCategory = availableScopeChoices[0];
  const firstScope = firstCategory.scopeItems[0];
  const firstMethod = firstScope.availableDeliveryMethods[0];

  const estimateSession: EstimateSession = {
    estimateId: 'EST-2026-0001',
    projectName: 'Northern Corridor Civils Prototype',
    clientName: 'Internal Demo Client',
    siteName: 'Demo Site A',
    location: 'Melbourne VIC',
    workCategoryCode: firstCategory.workCategoryCode,
    scopeItemCode: firstScope.scopeItemCode,
    deliveryMethodCode: firstMethod.deliveryMethodCode,
    status: 'Draft',
    reviewStatus: 'Needs review',
    quoteRequiredStatus: 'Quote follow-up',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const questionBank = mapQuestionGroups(projectInputs, inputOptions);
  const costByCode = costComponents.reduce<Record<string, CsvRow>>((acc, row) => {
    acc[row['Cost Component Code']] = row;
    return acc;
  }, {});

  const recentEstimates: EstimateSession[] = [
    estimateSession,
    { ...estimateSession, estimateId: 'EST-2026-0002', projectName: 'Depot Hardstand Upgrade', status: 'In Review', reviewStatus: 'Needs review' },
    { ...estimateSession, estimateId: 'EST-2026-0003', projectName: 'Generator Slab Program', status: 'Ready', reviewStatus: 'Clear' }
  ];

  return {
    estimateSession,
    availableScopeChoices,
    questionBank,
    scopeBuildMap,
    costComponents: costByCode,
    reviewHolds,
    extraCostTriggers,
    quoteRequiredItems,
    recentEstimates
  };
}
