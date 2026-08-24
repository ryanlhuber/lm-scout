import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type OpenRouterModel = {
  id?: string;
  name?: string;
  created?: number;
  expiration_date?: string | null;
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  [key: string]: unknown;
};

type CatalogSource = {
  name: string;
  kind: 'vendor' | 'openrouter' | 'huggingface' | 'ollama';
  url: string;
};

type ResearchSource = {
  name: string;
  kind: 'benchmark' | 'vendor';
  url: string;
  purpose: string;
};

type CatalogModel = OpenRouterModel & {
  id: string;
  name: string;
  catalog_source: CatalogSource;
  fallback_sources: CatalogSource[];
  research_sources: ResearchSource[];
};

const MODEL_LIMIT = 100;
const benchmarkSources = [
  { name: 'DeepSWE', url: 'https://deepswe.datacurve.ai/', purpose: 'Long-horizon software engineering' },
  { name: 'CursorBench', url: 'https://cursor.com/cursorbench', purpose: 'Real-world agentic coding' },
  { name: 'Artificial Analysis', url: 'https://artificialanalysis.ai/models', purpose: 'Intelligence, speed, and price' }
] as const;
const providerOrder = [
  'openai', 'anthropic', 'microsoft', 'meta', 'x-ai', 'deepseek', 'moonshotai', 'z-ai', 'xiaomi',
  'qwen', 'minimax', 'mistralai', 'tencent', 'nousresearch', 'cursor', 'google', 'nvidia',
  'bytedance-seed', 'stepfun', 'cohere', 'perplexity', 'amazon', 'ibm-granite', 'baidu', 'rekaai',
  'thinkingmachines', 'poolside', 'upstage', 'sakana', 'inclusionai', 'aion-labs'
];

const providerAliases: Record<string, string> = {
  'meta-llama': 'meta',
  bytedance: 'bytedance-seed'
};

const vendorSources: Record<string, { name: string; url: string }> = {
  openai: { name: 'OpenAI', url: 'https://platform.openai.com/docs/models' },
  anthropic: { name: 'Anthropic', url: 'https://docs.anthropic.com/en/docs/about-claude/models/overview' },
  microsoft: { name: 'Microsoft', url: 'https://ai.azure.com/catalog' },
  meta: { name: 'Meta', url: 'https://www.llama.com/models/' },
  'x-ai': { name: 'xAI', url: 'https://docs.x.ai/docs/models' },
  deepseek: { name: 'DeepSeek', url: 'https://api-docs.deepseek.com/quick_start/pricing' },
  moonshotai: { name: 'Moonshot AI', url: 'https://platform.moonshot.ai/docs' },
  'z-ai': { name: 'Z.ai', url: 'https://docs.z.ai/guides/overview' },
  xiaomi: { name: 'Xiaomi MiMo', url: 'https://github.com/XiaomiMiMo' },
  qwen: { name: 'Qwen', url: 'https://qwenlm.github.io/' },
  minimax: { name: 'MiniMax', url: 'https://platform.minimax.io/docs' },
  mistralai: { name: 'Mistral', url: 'https://docs.mistral.ai/getting-started/models/models_overview/' },
  tencent: { name: 'Tencent Hunyuan', url: 'https://hy.tencent.com/' },
  nousresearch: { name: 'Nous Research', url: 'https://huggingface.co/NousResearch' },
  cursor: { name: 'Cursor', url: 'https://docs.cursor.com/models' },
  google: { name: 'Google AI', url: 'https://ai.google.dev/gemini-api/docs/models' },
  nvidia: { name: 'NVIDIA', url: 'https://build.nvidia.com/models' },
  'bytedance-seed': { name: 'ByteDance Seed', url: 'https://github.com/ByteDance-Seed' },
  stepfun: { name: 'StepFun', url: 'https://platform.stepfun.com/' },
  cohere: { name: 'Cohere', url: 'https://docs.cohere.com/docs/models' },
  perplexity: { name: 'Perplexity', url: 'https://docs.perplexity.ai/getting-started/models' },
  amazon: { name: 'Amazon Bedrock', url: 'https://aws.amazon.com/bedrock/models/' },
  'ibm-granite': { name: 'IBM Granite', url: 'https://www.ibm.com/granite' },
  baidu: { name: 'Baidu', url: 'https://cloud.baidu.com/product/wenxinworkshop' },
  rekaai: { name: 'Reka AI', url: 'https://www.reka.ai/' },
  thinkingmachines: { name: 'Thinking Machines', url: 'https://thinkingmachines.ai/' },
  poolside: { name: 'Poolside', url: 'https://poolside.ai/' },
  upstage: { name: 'Upstage', url: 'https://console.upstage.ai/docs' },
  sakana: { name: 'Sakana AI', url: 'https://sakana.ai/' },
  inclusionai: { name: 'InclusionAI', url: 'https://github.com/inclusionAI' },
  'aion-labs': { name: 'Aion Labs', url: 'https://www.aionlabs.ai/' }
};

const preferredOpenAIIds = [
  'openai/gpt-5.6-luna',
  'openai/gpt-5.6-luna-pro',
  'openai/gpt-5.6-luna:batch',
  'openai/gpt-5.6-terra',
  'openai/gpt-5.6-terra-pro',
  'openai/gpt-5.6-sol',
  'openai/gpt-5.6-sol-pro'
];

// Current frontier families represented by DeepSWE and CursorBench. This order
// is used before release date when selecting the curated catalog; OpenRouter is
// retained only as the broad availability feed.
const benchmarkPriority = [
  'claude-opus-5', 'gpt-5.6-sol', 'claude-fable-5', 'grok-4.6', 'glm-5.3', 'kimi-k3',
  'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gemini-3.7-flash', 'deepseek-v4-pro',
  'claude-opus-4.8', 'qwen3.8-max', 'muse-spark-1.2', 'claude-sonnet-5',
  'deepseek-v4-flash', 'gemini-3.6-flash', 'glm-5.2', 'kimi-k2.7-code', 'composer-2.5'
];

const normalizeBenchmarkText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const benchmarkRank = (model: OpenRouterModel, benchmarkCorpora: string[]) => {
  const identity = `${model.id ?? ''} ${model.name ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const modelKeys = [model.id?.split('/').at(-1), model.name?.split(':').at(-1)]
    .filter((value): value is string => Boolean(value))
    .map(normalizeBenchmarkText)
    .filter((value) => value.length >= 5);

  for (let sourceIndex = 0; sourceIndex < benchmarkCorpora.length; sourceIndex += 1) {
    const positions = modelKeys.map((key) => benchmarkCorpora[sourceIndex].indexOf(key)).filter((position) => position >= 0);
    if (positions.length) return sourceIndex * 1_000_000 + Math.min(...positions);
  }

  const fallbackIndex = benchmarkPriority.findIndex((family) => identity.includes(family));
  return fallbackIndex < 0 ? Number.POSITIVE_INFINITY : benchmarkSources.length * 1_000_000 + fallbackIndex;
};

const officialModelPages: Record<string, string> = {
  'meta/muse-spark-1.2-contributor': 'https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2/',
  'meta/muse-spark-1.2': 'https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2/',
  'meta/muse-spark-1.1': 'https://research.meta.ai/blog/introducing-muse-spark-1-1/',
  'meta/muse-glimmer-30b': 'https://research.meta.ai/blog/introducing-muse-glimmer-an-open-agentic-model-that-runs-on-your-device/'
};

const sourceFor = (provider: string, id: string): { primary: CatalogSource; fallbacks: CatalogSource[] } => {
  const vendor = vendorSources[provider];
  const searchName = id.split('/').at(-1) ?? id;
  const openRouter: CatalogSource = { name: 'OpenRouter', kind: 'openrouter', url: `https://openrouter.ai/${id}` };
  const huggingFace: CatalogSource = { name: 'Hugging Face', kind: 'huggingface', url: `https://huggingface.co/models?search=${encodeURIComponent(searchName)}` };
  const ollama: CatalogSource = { name: 'Ollama', kind: 'ollama', url: `https://ollama.com/search?q=${encodeURIComponent(searchName)}` };
  if (vendor) return {
    primary: { ...vendor, url: officialModelPages[id] ?? vendor.url, kind: 'vendor' },
    fallbacks: [openRouter, huggingFace, ollama]
  };
  return { primary: openRouter, fallbacks: [huggingFace, ollama] };
};

const researchSourcesFor = (provider: string, id: string): ResearchSource[] => {
  const vendor = vendorSources[provider];
  const sources: ResearchSource[] = benchmarkSources.map((source) => ({ ...source, kind: 'benchmark' }));
  if (vendor) sources.push({
    name: `${vendor.name} official documentation`,
    kind: 'vendor',
    url: officialModelPages[id] ?? vendor.url,
    purpose: 'Specifications and availability'
  });
  return sources;
};

const providerFor = (id: string) => {
  const slug = id.replace(/^~/, '').split('/')[0];
  return providerAliases[slug] ?? slug;
};

const loadBenchmarkCorpora = async (fetcher: typeof fetch) => {
  const results = await Promise.allSettled(benchmarkSources.map(async (source) => {
    const response = await fetcher(source.url, {
      headers: { accept: 'text/html' },
      signal: AbortSignal.timeout(4_000)
    });
    if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);
    return normalizeBenchmarkText(await response.text());
  }));
  return results.map((result) => result.status === 'fulfilled' ? result.value : '');
};

const isEligible = (model: OpenRouterModel, now: number) => {
  if (!model.id || !model.name || model.id.startsWith('~')) return false;
  if (model.expiration_date && Date.parse(model.expiration_date) <= now) return false;

  const provider = providerFor(model.id);
  if (provider === 'stealth' || provider === 'openrouter') return false;
  if (model.id.includes(':') && !preferredOpenAIIds.includes(model.id)) return false;
  if (/\b(?:preview|experimental|exp)\b/i.test(`${model.id} ${model.name}`)) return false;

  const inputs = model.architecture?.input_modalities ?? ['text'];
  const outputs = model.architecture?.output_modalities ?? ['text'];
  return inputs.includes('text') && outputs.includes('text');
};

const curate = (models: OpenRouterModel[], now: number, benchmarkCorpora: string[]) => {
  const candidates = models.filter((model) => isEligible(model, now));
  const pools = new Map<string, OpenRouterModel[]>();

  for (const model of candidates) {
    const provider = providerFor(model.id!);
    const pool = pools.get(provider) ?? [];
    pool.push(model);
    pools.set(provider, pool);
  }

  for (const pool of pools.values()) {
    pool.sort((a, b) => {
      const aPreferred = preferredOpenAIIds.indexOf(a.id!);
      const bPreferred = preferredOpenAIIds.indexOf(b.id!);
      if (aPreferred >= 0 || bPreferred >= 0) {
        if (aPreferred < 0) return 1;
        if (bPreferred < 0) return -1;
        return aPreferred - bPreferred;
      }
      const aBenchmarkRank = benchmarkRank(a, benchmarkCorpora);
      const bBenchmarkRank = benchmarkRank(b, benchmarkCorpora);
      if (aBenchmarkRank !== bBenchmarkRank) {
        if (!Number.isFinite(aBenchmarkRank)) return 1;
        if (!Number.isFinite(bBenchmarkRank)) return -1;
        return aBenchmarkRank - bBenchmarkRank;
      }
      return (b.created ?? 0) - (a.created ?? 0);
    });
  }

  const selected: OpenRouterModel[] = [];
  const selectedIds = new Set<string>();
  const add = (model: OpenRouterModel) => {
    if (!model.id || selectedIds.has(model.id) || selected.length >= MODEL_LIMIT) return;
    selected.push(model);
    selectedIds.add(model.id);
  };

  for (const provider of providerOrder) {
    const quota = provider === 'openai' ? 7 : ['anthropic', 'google'].includes(provider) ? 5 : 4;
    for (const model of (pools.get(provider) ?? []).slice(0, quota)) add(model);
  }

  for (const model of candidates.sort((a, b) => {
    const aBenchmarkRank = benchmarkRank(a, benchmarkCorpora);
    const bBenchmarkRank = benchmarkRank(b, benchmarkCorpora);
    if (aBenchmarkRank !== bBenchmarkRank) {
      if (!Number.isFinite(aBenchmarkRank)) return 1;
      if (!Number.isFinite(bBenchmarkRank)) return -1;
      return aBenchmarkRank - bBenchmarkRank;
    }
    return (b.created ?? 0) - (a.created ?? 0);
  })) add(model);

  return selected.map((model): CatalogModel => {
    const source = sourceFor(providerFor(model.id!), model.id!);
    return {
      ...model,
      id: model.id!,
      name: model.name!,
      catalog_source: source.primary,
      fallback_sources: source.fallbacks,
      research_sources: researchSourcesFor(providerFor(model.id!), model.id!)
    };
  });
};

let cache: { data: CatalogModel[]; expiresAt: number; updatedAt: string } | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return json(cache, { headers: { 'cache-control': 'public, max-age=300' } });
  }

  const [response, benchmarkCorpora] = await Promise.all([
    fetch('https://openrouter.ai/api/v1/models', { headers: { accept: 'application/json' } }),
    loadBenchmarkCorpora(fetch)
  ]);
  if (!response.ok) return json({ message: 'The model catalog is temporarily unavailable.' }, { status: 502 });

  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  cache = {
    data: curate(payload.data ?? [], now, benchmarkCorpora),
    expiresAt: now + 5 * 60 * 1000,
    updatedAt: new Date(now).toISOString()
  };

  return json(cache, { headers: { 'cache-control': 'public, max-age=300' } });
};
