/**
 * Layer 1: CSV-derived source data for prototype use only.
 * Values are intentionally operator-safe labels derived from root CSV pack.
 */
export const sourceData = {
  workCategories: [
    { code: 'WC-FOUND', label: 'Foundations and Support Civils' },
    { code: 'WC-SLAB', label: 'Slabs and Bases' },
    { code: 'WC-EW', label: 'Earthworks and Reinstatement' },
    { code: 'WC-PIT', label: 'Concrete Pits' },
    { code: 'WC-PAVE', label: 'Pavement and Hardstand' },
    { code: 'WC-PROVE', label: 'Proving and Brownfield Controls' },
    { code: 'WC-PRELIM', label: 'Preliminaries and Controls' },
    { code: 'WC-DRAIN', label: 'Drainage and Minor Civil Structures' },
    { code: 'WC-FENCE', label: 'Fencing and Access-Control Works' },
    { code: 'WC-ENV', label: 'Environmental and Traffic Overlays' },
    { code: 'WC-GEN', label: 'Temporary Power and Generator Support' },
  ],
  scopeItems: [
    {
      code: 'SI-PIT-NEW',
      workCategoryCode: 'WC-PIT',
      label: 'New concrete pit install',
      description: 'Install concrete pit with local reinstatement and controls.',
      defaultUnit: 'each',
    },
    {
      code: 'SI-PIT-REP',
      workCategoryCode: 'WC-PIT',
      label: 'Concrete pit replacement',
      description: 'Replace existing pit with controlled excavation and reinstatement.',
      defaultUnit: 'each',
    },
    {
      code: 'SI-HDS-CONC',
      workCategoryCode: 'WC-PAVE',
      label: 'Concrete hardstand',
      description: 'Construct or reinstate concrete hardstand area.',
      defaultUnit: 'm2',
    },
    {
      code: 'SI-PROV-NDD',
      workCategoryCode: 'WC-PROVE',
      label: 'Non-destructive proving',
      description: 'Proving activities where assets are known/suspected nearby.',
      defaultUnit: 'count',
    },
    {
      code: 'SI-GEN-HIRE-DAY',
      workCategoryCode: 'WC-GEN',
      label: 'Daily generator hire support',
      description: 'Temporary power deployment and generator support.',
      defaultUnit: 'day',
    },
  ],
  deliveryMethods: [
    { code: 'DM-PIT-STD', scopeItemCode: 'SI-PIT-NEW', label: 'Standard pit install', methodType: 'Standard', isDefault: true },
    { code: 'DM-PIT-LRG', scopeItemCode: 'SI-PIT-NEW', label: 'Large pit install', methodType: 'Large pit', isDefault: false },
    { code: 'DM-PIT-REP', scopeItemCode: 'SI-PIT-REP', label: 'Pit replacement', methodType: 'Brownfield', isDefault: true },
    { code: 'DM-HDS-CONC-LD', scopeItemCode: 'SI-HDS-CONC', label: 'Hardstand light duty', methodType: 'Light duty', isDefault: true },
    { code: 'DM-HDS-CONC-HD', scopeItemCode: 'SI-HDS-CONC', label: 'Hardstand heavy duty', methodType: 'Heavy duty', isDefault: false },
    { code: 'DM-PROV-NDD', scopeItemCode: 'SI-PROV-NDD', label: 'NDD proving', methodType: 'Proving', isDefault: true },
    { code: 'DM-GEN-HIRE-DAY-STD', scopeItemCode: 'SI-GEN-HIRE-DAY', label: 'Daily hire', methodType: 'Hire', isDefault: true },
  ],
  projectInputs: [
    { code: 'PI-A2M', scopeItemCode: 'SI-PIT-NEW', deliveryMethodCode: 'DM-PIT-STD', label: 'Are known or suspected assets within 2 metres of excavation?', answerType: 'yes/no', required: true },
    { code: 'PI-A2M-LRG', scopeItemCode: 'SI-PIT-NEW', deliveryMethodCode: 'DM-PIT-LRG', label: 'Are known or suspected assets within 2 metres of excavation?', answerType: 'yes/no', required: true },
    { code: 'PI-RIS', scopeItemCode: 'SI-PIT-NEW', deliveryMethodCode: 'DM-PIT-STD', label: 'Is a riser required?', answerType: 'yes/no', required: true },
    { code: 'PI-RIS-LRG', scopeItemCode: 'SI-PIT-NEW', deliveryMethodCode: 'DM-PIT-LRG', label: 'Is a riser required?', answerType: 'yes/no', required: true },
    { code: 'PI-SURF', scopeItemCode: 'SI-HDS-CONC', deliveryMethodCode: 'DM-HDS-CONC-LD', label: 'What is the existing surface type?', answerType: 'choice', required: true },
    { code: 'PI-SEP', scopeItemCode: 'SI-HDS-CONC', deliveryMethodCode: 'DM-HDS-CONC-HD', label: 'Is a geotextile / separator layer required?', answerType: 'yes/no', required: true },
    { code: 'PI-NDD-CNT', scopeItemCode: 'SI-PROV-NDD', deliveryMethodCode: 'DM-PROV-NDD', label: 'How many proving locations are required?', answerType: 'whole number', required: true },
  ],
  inputOptions: [
    { projectInputCode: 'PI-SURF', label: 'Concrete', value: 'Concrete' },
    { projectInputCode: 'PI-SURF', label: 'Asphalt', value: 'Asphalt' },
    { projectInputCode: 'PI-SURF', label: 'Gravel / crushed rock', value: 'Gravel / crushed rock' },
    { projectInputCode: 'PI-SURF', label: 'Softscape', value: 'Softscape' },
  ],
  reviewHolds: [
    { name: 'Water condition review', message: 'Abnormal water conditions may require reviewer approval.', when: 'water' },
    { name: 'Asset conflict review', message: 'Known or suspected assets nearby require review pathway.', when: 'assets' },
  ],
  extraCostTriggers: [
    { name: 'Proving before excavation', message: 'Proving must occur before mechanical excavation when assets are within 2 m.' },
    { name: 'Temporary make-safe controls', message: 'Temporary make-safe controls are required where excavation risk is elevated.' },
  ],
  quoteRequiredItems: [
    'Concrete pit risers',
    'Concrete pit lid and frame library',
    'Geotextile / separator layer',
  ],
  assumptions: [
    'Site access and permits are available at planned start.',
    'Normal working hours unless explicitly selected otherwise.',
    'Reinstatement quantities are based on entered disturbed area.',
  ],
  exclusions: [
    'Final supplier quote pricing for unresolved placeholder items.',
    'Out-of-scope telecom family work outside current civils phase.',
  ],
};

export type SourceData = typeof sourceData;
