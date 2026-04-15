export type EstimateStatus = 'Draft' | 'In Review' | 'Ready';

export interface EstimateSession {
  estimateId: string;
  projectName: string;
  clientName: string;
  siteName: string;
  location: string;
  workCategoryCode?: string;
  scopeItemCode?: string;
  deliveryMethodCode?: string;
  status: EstimateStatus;
  reviewStatus: 'Clear' | 'Review Required';
  quoteRequiredStatus: 'None' | 'Quote Required';
  createdAt: string;
  updatedAt: string;
}

export interface AvailableScopeChoices {
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
}

export interface ActiveQuestionGroup {
  groupId: string;
  groupLabel: string;
  groupDescription: string;
  displayOrder: number;
  questions: {
    projectInputCode: string;
    label: string;
    helpText: string;
    answerType: string;
    unit: string;
    required: boolean;
    defaultValue?: string;
    options: { label: string; value: string }[];
    visibilityRule: string;
    advancedFlag: boolean;
  }[];
}

export interface EstimateSummary {
  baseItems: string[];
  addOns: string[];
  reviewItems: string[];
  quoteRequiredItems: string[];
  assumptions: string[];
  exclusions: string[];
  totals: { lineItemCount: number; indicativeRange: string };
  readyState: 'Draft' | 'Review Required' | 'Ready';
}

export interface TriggeredControls {
  reviewHolds: string[];
  extraCostTriggers: string[];
  quoteRequiredItems: string[];
  warnings: string[];
  blockers: string[];
}

export interface OutputPreviewModel {
  projectHeader: string;
  scopeSummary: string;
  groupedLineItems: { group: string; items: string[] }[];
  assumptions: string[];
  exclusions: string[];
  reviewNotes: string[];
  quoteRequiredNotes: string[];
  footerStatus: string;
}

export interface AdapterModel {
  estimateSession: EstimateSession;
  availableScopeChoices: AvailableScopeChoices[];
  activeQuestionGroups: ActiveQuestionGroup[];
  estimateSummary: EstimateSummary;
  triggeredControls: TriggeredControls;
  outputPreviewModel: OutputPreviewModel;
}
