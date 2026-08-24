<script lang="ts">
  import { onMount } from 'svelte';
  import Search from '@lucide/svelte/icons/search';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import GitCompareArrows from '@lucide/svelte/icons/git-compare-arrows';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Menu from '@lucide/svelte/icons/menu';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Brain from '@lucide/svelte/icons/brain';
  import Zap from '@lucide/svelte/icons/zap';
  import Coins from '@lucide/svelte/icons/coins';
  import Gauge from '@lucide/svelte/icons/gauge';
  import CircleHelp from '@lucide/svelte/icons/circle-help';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';

  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';

  type ModelCard = {
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

  type OpenRouterModel = {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[] };
    pricing?: { prompt?: string; completion?: string };
    supported_parameters?: string[];
    reasoning?: { supported_efforts?: string[]; default_effort?: string };
  };

  const providerNames: Record<string, string> = {
    openai: 'OpenAI', anthropic: 'Anthropic', microsoft: 'Microsoft', meta: 'Meta', 'meta-llama': 'Meta',
    'x-ai': 'xAI', deepseek: 'DeepSeek', moonshotai: 'Moonshot AI', 'z-ai': 'Z.ai', xiaomi: 'Xiaomi',
    qwen: 'Alibaba', minimax: 'MiniMax', mistralai: 'Mistral', tencent: 'Tencent', nousresearch: 'Nous Research',
    cursor: 'Cursor', google: 'Google / DeepMind', nvidia: 'NVIDIA', bytedance: 'ByteDance', 'bytedance-seed': 'ByteDance', stepfun: 'StepFun',
    cohere: 'Cohere', openrouter: 'OpenRouter'
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
    add(strengths.includes('Structured Output'), 'Data extraction');

    if (!uses.size) uses.add('General assistance');
    return [...uses].slice(0, 3);
  };

  const mapModel = (model: OpenRouterModel): ModelCard => {
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
      summary: cleanDescription(model.description) || 'Available through OpenRouter.',
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

  const formatContext = (tokens: number) => tokens ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(tokens) : '—';
  const formatPrice = (price: number) => {
    if (price < 0) return 'Varies';
    if (price === 0) return 'Free';
    const perMillion = price * 1_000_000;
    return `$${perMillion.toLocaleString('en-US', { maximumFractionDigits: perMillion < 1 ? 3 : 2 })}`;
  };
  const effortLabel = (effort: string) => effort === 'xhigh' ? 'Extra high' : effort.charAt(0).toUpperCase() + effort.slice(1);
  const normalizeModelName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  let models: ModelCard[] = [];
  let loading = true;
  let loadError = '';
  let vendors: string[] = [];
  let tasks: string[] = [];
  let comparisonModels: [ModelCard, ModelCard] | null = null;

  let query = '';
  let selectedTask = 'All tasks';
  let selectedVendor = 'All vendors';
  let mobileFiltersOpen = false;
  let theme: 'light' | 'dark' = 'light';

  const setTheme = (nextTheme: 'light' | 'dark') => {
    theme = nextTheme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('lm-scout-theme', theme);
  };

  onMount(async () => {
    theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Catalog request failed');
      const payload = await response.json() as { data: OpenRouterModel[] };
      models = payload.data.map(mapModel);
    } catch {
      loadError = 'The live OpenRouter catalog could not be loaded. Try refreshing in a moment.';
    } finally {
      loading = false;
    }
  });

  $: vendors = [...new Set(models.map((model) => model.vendor))].sort();
  $: tasks = [...new Set(models.flatMap((model) => model.strengths))].sort();

  $: comparisonModels = (() => {
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
  })();

  $: filteredModels = comparisonModels ? [] : models.filter((model) => {
    const matchesQuery = `${model.name} ${model.vendor} ${model.configuration} ${model.strengths.join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesVendor = selectedVendor === 'All vendors' || model.vendor === selectedVendor;
    const matchesTask = selectedTask === 'All tasks' || model.strengths.includes(selectedTask);
    return matchesQuery && matchesVendor && matchesTask;
  });
</script>

<svelte:head>
  <title>LM Scout — Find the right AI model for the task</title>
  <meta
    name="description"
    content="Compare AI models, providers, harnesses, pricing, reasoning levels, and real-world strengths."
  />
</svelte:head>

<div class="min-h-screen bg-background">
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2.5" aria-label="LM Scout home">
          <div class="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles class="size-4" />
          </div>
          <span class="text-base font-semibold tracking-tight">LM Scout</span>
        </a>

        <nav class="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Primary navigation">
          <a href="#models" class="font-medium text-foreground">Models</a>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onclick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {#if theme === 'dark'}
            <Sun class="size-4" />
          {:else}
            <Moon class="size-4" />
          {/if}
        </Button>
        <Button class="hidden sm:inline-flex" variant="outline" size="sm">
          <GitCompareArrows />
          Compare
        </Button>
        <Button class="sm:hidden" variant="ghost" size="icon" aria-label="Open navigation">
          <Menu />
        </Button>
      </div>
    </div>
  </header>

  <main>
    <section class="border-b">
      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div class="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div class="max-w-3xl">
            <h1 class="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Find the right AI model for the task.
            </h1>
            <p class="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Browse every currently available OpenRouter model by provider, context window, modality, pricing, tool support, and reasoning controls.
            </p>
          </div>

          <Card class="bg-muted/35 p-5 shadow-none sm:p-6">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Brain class="size-4" />
              </div>
              <div>
                <p class="text-sm font-semibold">Task-first recommendations</p>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  Tell LM Scout what you are building, your budget, harness, and preferred speed-versus-quality balance.
                </p>
              </div>
            </div>
            <Button class="mt-5 w-full sm:w-auto" size="sm">
              Find a model
              <ArrowUpRight />
            </Button>
          </Card>
        </div>
      </div>
    </section>

    <section id="models" class="mx-auto max-w-7xl scroll-mt-16 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div class="flex flex-col gap-5 border-b pb-6">
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Explore models</h2>
              <Badge variant="secondary">{loading ? 'Loading…' : comparisonModels ? 'Comparing 2 models' : `${filteredModels.length} of ${models.length} models`}</Badge>
            </div>
          </div>

          <Button class="md:hidden" variant="outline" onclick={() => (mobileFiltersOpen = !mobileFiltersOpen)}>
            <SlidersHorizontal />
            Filters
          </Button>
        </div>

        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <label class="relative block">
            <span class="sr-only">Search models</span>
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input class="pl-9" placeholder="Search models, vendors, or strengths..." bind:value={query} />
          </label>

          <div class:hidden={!mobileFiltersOpen} class="lg:block">
            <label class="sr-only" for="vendor-filter">Vendor</label>
            <select
              id="vendor-filter"
              bind:value={selectedVendor}
              class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option>All vendors</option>
              {#each vendors as vendor}
                <option>{vendor}</option>
              {/each}
            </select>
          </div>

          <div class:hidden={!mobileFiltersOpen} class="lg:block">
            <label class="sr-only" for="task-filter">Task</label>
            <select
              id="task-filter"
              bind:value={selectedTask}
              class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option>All tasks</option>
              {#each tasks as task}
                <option>{task}</option>
              {/each}
            </select>
          </div>

          <div class:hidden={!mobileFiltersOpen} class="lg:block">
            <Button class="w-full lg:w-auto" variant="outline">
              <SlidersHorizontal />
              More filters
            </Button>
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-3">
        {#if loading}
          <Card class="col-span-full flex min-h-64 items-center justify-center p-8 text-center shadow-none">
            <div>
              <div class="mx-auto size-8 animate-pulse rounded-full bg-muted"></div>
              <p class="mt-4 text-sm font-medium">Loading the live OpenRouter catalog…</p>
            </div>
          </Card>
        {:else if loadError}
          <Card class="col-span-full flex min-h-64 items-center justify-center p-8 text-center shadow-none">
            <div class="max-w-md">
              <h3 class="font-semibold">Catalog unavailable</h3>
              <p class="mt-2 text-sm text-muted-foreground">{loadError}</p>
            </div>
          </Card>
        {:else if comparisonModels}
          <Card class="col-span-full overflow-hidden shadow-none">
            <div class="border-b px-5 py-4 sm:px-6">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Model comparison</p>
              <h3 class="mt-1 text-xl font-semibold tracking-tight">{comparisonModels[0].name} vs {comparisonModels[1].name}</h3>
            </div>
            <div class="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch sm:p-6">
              {#each comparisonModels as comparisonModel, index}
                {#if index === 1}
                  <div class="hidden items-center md:flex" aria-hidden="true">
                    <Badge variant="secondary">VS</Badge>
                  </div>
                {/if}
                <div class="rounded-xl border bg-muted/20 p-5">
                  <div class="flex items-center gap-2">
                    <ProviderLogo vendor={comparisonModel.vendor} modelId={comparisonModel.id} size="sm" />
                    <span class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{comparisonModel.vendor}</span>
                  </div>
                  <h4 class="mt-2 text-xl font-semibold tracking-tight">{comparisonModel.name}</h4>
                  <p class="mt-1 text-sm text-muted-foreground">{comparisonModel.configuration}</p>

                  <div class="mt-5 grid grid-cols-3 gap-2">
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Context</p>
                      <p class="mt-1 text-lg font-semibold tabular-nums">{formatContext(comparisonModel.contextLength)}</p>
                    </div>
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Input / M</p>
                      <p class="mt-1 text-lg font-semibold tabular-nums">{formatPrice(comparisonModel.promptPrice)}</p>
                    </div>
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Output / M</p>
                      <p class="mt-1 text-lg font-semibold tabular-nums">{formatPrice(comparisonModel.completionPrice)}</p>
                    </div>
                  </div>

                  <p class="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{comparisonModel.summary}</p>
                  <div class="mt-4 flex flex-wrap gap-1.5">
                    {#each comparisonModel.strengths as strength}
                      <Badge variant="outline">{strength}</Badge>
                    {/each}
                  </div>
                  <div class="mt-4">
                    <p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Uses</p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      {#each comparisonModel.uses as use}
                        <Badge variant="secondary">{use}</Badge>
                      {/each}
                    </div>
                  </div>
                  <div class="mt-5 flex items-center justify-between border-t pt-4 text-sm">
                    <span class="text-muted-foreground">Reasoning effort</span>
                    <Badge variant="secondary">
                      {comparisonModel.reasoningLevel === null
                        ? (comparisonModel.reasoningAvailable ? 'Fixed' : 'Unavailable')
                        : effortLabel(comparisonModel.reasoningEfforts[comparisonModel.reasoningLevel])}
                    </Badge>
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        {:else}
          {#each filteredModels as model}
          <Card class="group flex h-full flex-col overflow-hidden shadow-none transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
              <div class="flex min-w-0 items-start gap-3">
                <ProviderLogo vendor={model.vendor} modelId={model.id} />
                <div class="min-w-0">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{model.vendor}</p>
                  <h3 class="mt-1 truncate text-xl font-semibold tracking-tight">{model.name}</h3>
                  <p class="mt-1 text-sm text-muted-foreground">{model.configuration}</p>
                </div>
              </div>
              <a
                class="flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-accent"
                href={`/models/${model.id.split('/').map(encodeURIComponent).join('/')}`}
                aria-label={`View details for ${model.name}`}
              >
                <ChevronRight class="size-4" />
              </a>
            </div>

            <div class="flex flex-1 flex-col p-5 sm:p-6">
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Gauge class="size-3.5" />Context</div>
                  <p class="mt-2 text-xl font-semibold tabular-nums">{formatContext(model.contextLength)}</p>
                </div>
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Coins class="size-3.5" />Input / M</div>
                  <p class="mt-2 text-xl font-semibold tabular-nums">{formatPrice(model.promptPrice)}</p>
                </div>
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Zap class="size-3.5" />Output / M</div>
                  <p class="mt-2 text-xl font-semibold tabular-nums">{formatPrice(model.completionPrice)}</p>
                </div>
              </div>

              <p class="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">{model.summary}</p>

              <div class="mt-5">
                <p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Capabilities</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  {#each model.strengths as strength}
                    <Badge variant="outline">{strength}</Badge>
                  {/each}
                </div>
              </div>

              <div class="mt-5">
                <p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Uses</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  {#each model.uses as use}
                    <Badge variant="secondary">{use}</Badge>
                  {/each}
                </div>
              </div>

              <div class="mt-auto pt-6">
                <div class="border-t pt-4">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-1.5">
                      <label class="text-sm font-medium" for={`reasoning-${model.id}`}>Reasoning</label>
                      {#if model.reasoningLevel === null}
                        <span class="group relative inline-flex">
                          <button
                            type="button"
                            class="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            aria-label={`Why reasoning is unavailable for ${model.name}`}
                            aria-describedby={`reasoning-tooltip-${model.id}`}
                          >
                            <CircleHelp class="size-3.5" />
                          </button>
                          <span
                            id={`reasoning-tooltip-${model.id}`}
                            role="tooltip"
                            class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-52 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-center text-xs text-background shadow-lg group-hover:block group-focus-within:block"
                          >
                            {model.reasoningAvailable ? 'This model offers reasoning, but not configurable effort.' : "This model doesn't offer reasoning."}
                          </span>
                        </span>
                      {/if}
                    </div>
                    <Badge variant={model.reasoningLevel === null ? 'secondary' : 'outline'}>
                      {model.reasoningLevel === null ? (model.reasoningAvailable ? 'Fixed' : 'Unavailable') : effortLabel(model.reasoningEfforts[model.reasoningLevel])}
                    </Badge>
                  </div>

                  <input
                    id={`reasoning-${model.id}`}
                    class="reasoning-slider mt-3 w-full"
                    type="range"
                    min="0"
                    max={Math.max(0, model.reasoningEfforts.length - 1)}
                    step="1"
                    value={model.reasoningLevel ?? 0}
                    disabled={model.reasoningLevel === null}
                    style={`--reasoning-position: ${model.reasoningLevel === null ? 0 : (model.reasoningLevel / Math.max(1, model.reasoningEfforts.length - 1)) * 100}%`}
                    aria-valuetext={model.reasoningLevel === null ? (model.reasoningAvailable ? 'Reasoning effort is fixed' : 'Reasoning unavailable') : effortLabel(model.reasoningEfforts[model.reasoningLevel])}
                    oninput={(event) => (model.reasoningLevel = Number(event.currentTarget.value))}
                  />
                  {#if model.reasoningEfforts.length}
                    <div class="relative mt-1 h-1.5" aria-hidden="true">
                      {#each model.reasoningEfforts as _, index}
                        <span
                          class="absolute top-0 h-1.5 w-px -translate-x-1/2 bg-muted-foreground/60"
                          style={`left: calc(0.5rem + (100% - 1rem) * ${index} / ${Math.max(1, model.reasoningEfforts.length - 1)})`}
                        ></span>
                      {/each}
                    </div>
                  {/if}
                  <div class="mt-0.5 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
                    <span>{model.reasoningEfforts.length ? effortLabel(model.reasoningEfforts[0]) : 'Not configurable'}</span>
                    <span>{model.reasoningEfforts.length > 1 ? effortLabel(model.reasoningEfforts.at(-1) ?? '') : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {:else}
            <Card class="col-span-full flex min-h-64 items-center justify-center p-8 text-center shadow-none">
              <div class="max-w-sm">
                <div class="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Search class="size-4" />
                </div>
                <h3 class="mt-4 font-semibold">No models match those filters</h3>
                <p class="mt-2 text-sm text-muted-foreground">Try another vendor, capability, or search term.</p>
              </div>
            </Card>
          {/each}
        {/if}
      </div>
    </section>

  </main>

  <footer class="border-t">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div class="flex items-center gap-2">
        <div class="size-2 rounded-full bg-foreground"></div>
        <span>LM Scout</span>
      </div>
      <p>Initial interface prototype · Sample data only</p>
    </div>
  </footer>
</div>
