export type ModelCard = {
  id: string;
  name: string;
  vendor: string;
  configuration: string;
  summary: string;
  strengths: string[];
  uses: string[];
  contextLength: number;
  promptPrice: number;
  completionPrice: number;
  inputModalities: string[];
  outputModalities: string[];
  reasoningAvailable: boolean;
  reasoningLevel: number | null;
  reasoningEfforts: string[];
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
  reasoning?: { supported_efforts?: string[]; default_effort?: string };
  catalog_source?: { name: string; kind: string; url: string };
};

export const ALL_VENDORS = 'All vendors';
export const ALL_TASKS = 'All tasks';

const providerNames: Record<string, string> = {
  openai: 'OpenAI', anthropic: 'Anthropic', microsoft: 'Microsoft', meta: 'Meta', 'meta-llama': 'Meta',
  'x-ai': 'xAI', deepseek: 'DeepSeek', moonshotai: 'Moonshot AI', 'z-ai': 'Z.ai', xiaomi: 'Xiaomi',
  qwen: 'Alibaba', minimax: 'MiniMax', mistralai: 'Mistral', tencent: 'Tencent', nousresearch: 'Nous Research',
  cursor: 'Cursor', google: 'Google', nvidia: 'NVIDIA', bytedance: 'ByteDance', 'bytedance-seed': 'ByteDance', stepfun: 'StepFun',
  cohere: 'Cohere', perplexity: 'Perplexity', amazon: 'Amazon', 'ibm-granite': 'IBM', baidu: 'Baidu',
  rekaai: 'Reka AI', thinkingmachines: 'Thinking Machines', poolside: 'Poolside', upstage: 'Upstage',
  sakana: 'Sakana AI', inclusionai: 'InclusionAI', 'aion-labs': 'Aion Labs', openrouter: 'OpenRouter'
};

const effortOrder = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

const labelProvider = (id: string) => {
  const slug = id.replace(/^~/, '').split('/')[0];
  return providerNames[slug] ?? slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

const cleanDescription = (description = '') => description
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[#*_`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const getStrengths = (model: OpenRouterModel, reasoningAvailable: boolean) => {
  const strengths = new Set<string>();
  const inputs = model.architecture?.input_modalities ?? ['text'];
  const parameters = model.supported_parameters ?? [];
  if (reasoningAvailable) strengths.add('Reasoning');
  if (parameters.includes('tools') || parameters.includes('tool_choice')) strengths.add('Tool Use');
  if ((model.context_length ?? 0) >= 200_000) strengths.add('Long-Context');
  if (inputs.includes('image')) strengths.add('Vision');
  if (inputs.includes('audio')) strengths.add('Audio');
  if (inputs.includes('video')) strengths.add('Video');
  if (parameters.includes('structured_outputs')) strengths.add('Structured Output');
  if (strengths.size === 0) strengths.add('Text');
  return [...strengths];
};

const getUses = (model: OpenRouterModel, strengths: string[]) => {
  const text = `${model.name} ${model.description ?? ''}`.toLowerCase();
  const uses = new Set<string>();
  const add = (condition: boolean, label: string) => condition && uses.add(label);

  add(/front.?end|react|vue|svelte|angular|web app|website/.test(text), 'Front-end development');
  add(/\bui\b|user interface|interface design|screenshot.to.code/.test(text), 'UI design');
  add(/diagram|flowchart|architecture visual/.test(text), 'Diagramming');
  add(/ocr|document image|text recognition/.test(text), 'OCR & document extraction');
  add(/sql|spreadsheet|data analy|analytics/.test(text), 'Data analysis');
  add(/security|vulnerab|threat|cyber/.test(text), 'Security review');
  add(/test|debug|code review|refactor/.test(text), 'Code review & debugging');
  add(/embed|retrieval|semantic search/.test(text), 'Semantic search');
  add(/translat|multilingual|language pair/.test(text), 'Translation');
  add(/code|coding|coder|software|developer/.test(text), 'Software development');
  add(strengths.includes('Tool Use') || /agent|tool use/.test(text), 'Agentic workflows');
  add(strengths.includes('Vision') || /vision|image/.test(text), 'Visual analysis');
  add(strengths.includes('Video') || /video/.test(text), 'Video understanding');
  add(strengths.includes('Audio') || /audio|speech|voice/.test(text), 'Audio workflows');
  add(strengths.includes('Long-Context') || /long.context|document/.test(text), 'Long-document analysis');
  add(/research|scientific/.test(text), 'Research');
  add(/writ|creative|story|content/.test(text), 'Writing & content');
  add(/math|logic|reasoning/.test(text), 'Complex problem-solving');
  add(/plan|strategy|long.horizon/.test(text), 'Planning & strategy');
  add(strengths.includes('Structured Output'), 'Data extraction');

  if (!uses.size) uses.add('General assistance');
  return [...uses].slice(0, 4);
};

export const mapModel = (model: OpenRouterModel): ModelCard => {
  const parameters = model.supported_parameters ?? [];
  const reasoningAvailable = Boolean(model.reasoning) || parameters.some((parameter) => ['reasoning', 'reasoning_effort', 'include_reasoning'].includes(parameter));
  const reasoningEfforts = [...(model.reasoning?.supported_efforts ?? [])].sort((a, b) => effortOrder.indexOf(a) - effortOrder.indexOf(b));
  const defaultEffort = model.reasoning?.default_effort;
  const defaultLevel = reasoningEfforts.length ? Math.max(0, defaultEffort ? reasoningEfforts.indexOf(defaultEffort) : Math.floor(reasoningEfforts.length / 2)) : null;
  const vendor = labelProvider(model.id);
  const name = model.name.includes(':') ? model.name.split(':').slice(1).join(':').trim() : model.name;
  const strengths = getStrengths(model, reasoningAvailable);

  return {
    id: model.id,
    name,
    vendor,
    configuration: (model.architecture?.modality ?? 'text->text').replace('->', ' → ').replaceAll('+', ' + '),
    summary: cleanDescription(model.description) || 'Current model metadata is limited.',
    strengths,
    uses: getUses(model, strengths),
    contextLength: model.context_length ?? 0,
    promptPrice: Number(model.pricing?.prompt ?? 0),
    completionPrice: Number(model.pricing?.completion ?? 0),
    inputModalities: model.architecture?.input_modalities ?? ['text'],
    outputModalities: model.architecture?.output_modalities ?? ['text'],
    reasoningAvailable,
    reasoningLevel: defaultLevel,
    reasoningEfforts
  };
};

export const formatContext = (tokens: number) => tokens ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(tokens) : '—';
export const formatPrice = (price: number) => {
  if (price < 0) return 'Varies';
  if (price === 0) return 'Free';
  const perMillion = price * 1_000_000;
  return `$${perMillion.toLocaleString('en-US', { maximumFractionDigits: perMillion < 1 ? 3 : 2 })}`;
};
export const effortLabel = (effort: string) => effort === 'xhigh' ? 'Extra high' : effort.charAt(0).toUpperCase() + effort.slice(1);
export const reasoningSummary = (model: ModelCard) => model.reasoningLevel === null
  ? (model.reasoningAvailable ? 'Fixed' : 'Unavailable')
  : effortLabel(model.reasoningEfforts[model.reasoningLevel]);
export const modelHref = (id: string) => `/models/${id.split('/').map(encodeURIComponent).join('/')}`;

const normalizeModelName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Matches queries like "GPT-5 vs Claude Opus" against the catalog. */
export const findComparison = (models: ModelCard[], query: string): [ModelCard, ModelCard] | null => {
  const match = query.trim().match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i);
  if (!match) return null;

  const findModel = (value: string) => {
    const normalized = normalizeModelName(value);
    return models.find((model) => normalizeModelName(model.name) === normalized)
      ?? models.find((model) => normalizeModelName(model.name).includes(normalized));
  };

  const first = findModel(match[1]);
  const second = findModel(match[2]);
  return first && second && first.id !== second.id ? [first, second] : null;
};

export const matchesFilters = (model: ModelCard, query: string, vendor: string, task: string) => {
  const matchesQuery = `${model.name} ${model.vendor} ${model.configuration} ${model.strengths.join(' ')} ${model.uses.join(' ')}`
    .toLowerCase()
    .includes(query.toLowerCase());
  const matchesVendor = vendor === ALL_VENDORS || model.vendor === vendor;
  const matchesTask = task === ALL_TASKS || model.uses.includes(task);
  return matchesQuery && matchesVendor && matchesTask;
};
