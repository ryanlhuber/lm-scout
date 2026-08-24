<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Braces from '@lucide/svelte/icons/braces';
  import Brain from '@lucide/svelte/icons/brain';
  import Check from '@lucide/svelte/icons/check';
  import Coins from '@lucide/svelte/icons/coins';
  import Copy from '@lucide/svelte/icons/copy';
  import Gauge from '@lucide/svelte/icons/gauge';
  import Moon from '@lucide/svelte/icons/moon';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Sun from '@lucide/svelte/icons/sun';
  import Zap from '@lucide/svelte/icons/zap';

  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';

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

  let { data }: { data: { model: OpenRouterModel; related: OpenRouterModel[]; updatedAt: string } } = $props();

  const providerNames: Record<string, string> = {
    openai: 'OpenAI', anthropic: 'Anthropic', microsoft: 'Microsoft', meta: 'Meta', 'meta-llama': 'Meta',
    'x-ai': 'xAI', deepseek: 'DeepSeek', moonshotai: 'Moonshot AI', 'z-ai': 'Z.ai', xiaomi: 'Xiaomi',
    qwen: 'Alibaba', minimax: 'MiniMax', mistralai: 'Mistral', tencent: 'Tencent', nousresearch: 'Nous Research',
    cursor: 'Cursor', google: 'Google / DeepMind', nvidia: 'NVIDIA', bytedance: 'ByteDance', 'bytedance-seed': 'ByteDance',
    stepfun: 'StepFun', cohere: 'Cohere', openrouter: 'OpenRouter'
  };

  const effortOrder = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
  const model = $derived(data.model);
  const providerSlug = $derived(model.id.replace(/^~/, '').split('/')[0]);
  const vendor = $derived(providerNames[providerSlug] ?? providerSlug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '));
  const displayName = $derived(model.name.includes(':') ? model.name.split(':').slice(1).join(':').trim() : model.name);
  const parameters = $derived(model.supported_parameters ?? []);
  const inputs = $derived(model.architecture?.input_modalities ?? ['text']);
  const outputs = $derived(model.architecture?.output_modalities ?? ['text']);
  const reasoningAvailable = $derived(Boolean(model.reasoning) || parameters.some((parameter) => ['reasoning', 'reasoning_effort', 'include_reasoning'].includes(parameter)));
  const reasoningEfforts = $derived([...(model.reasoning?.supported_efforts ?? [])].sort((a, b) => effortOrder.indexOf(a) - effortOrder.indexOf(b)));
  const capabilities = $derived.by(() => {
    const values = new Set<string>();
    if (reasoningAvailable) values.add('Reasoning');
    if (parameters.includes('tools') || parameters.includes('tool_choice')) values.add('Tool Use');
    if ((model.context_length ?? 0) >= 200_000) values.add('Long-Context');
    if (inputs.includes('image')) values.add('Vision');
    if (inputs.includes('audio')) values.add('Audio');
    if (inputs.includes('video')) values.add('Video');
    if (parameters.includes('structured_outputs')) values.add('Structured Output');
    if (!values.size) values.add('Text');
    return [...values];
  });
  const uses = $derived.by(() => {
    const text = `${model.name} ${model.description ?? ''}`.toLowerCase();
    const values = new Set<string>();
    const add = (condition: boolean, label: string) => condition && values.add(label);
    add(/embed|retrieval|semantic search/.test(text), 'Semantic search');
    add(/translat|multilingual|language pair/.test(text), 'Translation');
    add(/code|coding|coder|software|developer/.test(text), 'Software development');
    add(capabilities.includes('Tool Use') || /agent|tool use/.test(text), 'Agentic workflows');
    add(capabilities.includes('Vision') || /vision|image/.test(text), 'Visual analysis');
    add(capabilities.includes('Video') || /video/.test(text), 'Video understanding');
    add(capabilities.includes('Audio') || /audio|speech|voice/.test(text), 'Audio workflows');
    add(capabilities.includes('Long-Context') || /long.context|document/.test(text), 'Long-document analysis');
    add(/research|scientific/.test(text), 'Research');
    add(/writ|creative|story|content/.test(text), 'Writing & content');
    add(/math|logic|reasoning/.test(text), 'Complex problem-solving');
    add(capabilities.includes('Structured Output'), 'Data extraction');
    if (!values.size) values.add('General assistance');
    return [...values].slice(0, 4);
  });

  const cleanDescription = (description = '') => description
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const formatContext = (tokens = 0) => tokens ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(tokens) : '—';
  const formatPrice = (price: string | undefined) => {
    const value = Number(price ?? 0);
    if (value < 0) return 'Varies';
    if (value === 0) return 'Free';
    const perMillion = value * 1_000_000;
    return `$${perMillion.toLocaleString('en-US', { maximumFractionDigits: perMillion < 1 ? 3 : 2 })}`;
  };
  const formatModality = (values: string[]) => values.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(', ');
  const relatedName = (entry: OpenRouterModel) => entry.name.includes(':') ? entry.name.split(':').slice(1).join(':').trim() : entry.name;
  const detailHref = (id: string) => `/models/${id.split('/').map(encodeURIComponent).join('/')}`;
  const codeSample = $derived(`const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${model.id}",
    messages: [{ role: "user", content: "Hello" }]
  })
});`);

  let theme = $state<'light' | 'dark'>('light');
  let copied = $state(false);
  const setTheme = (nextTheme: 'light' | 'dark') => {
    theme = nextTheme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('lm-scout-theme', theme);
  };
  const copyModelId = async () => {
    await navigator.clipboard.writeText(model.id);
    copied = true;
    window.setTimeout(() => (copied = false), 1600);
  };

  onMount(() => {
    theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
</script>

<svelte:head>
  <title>{displayName} — LM Scout</title>
  <meta name="description" content={cleanDescription(model.description) || `${displayName} model details, pricing, and capabilities.`} />
</svelte:head>

<div class="min-h-screen bg-background">
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-7">
        <a href="/" class="flex items-center gap-2.5" aria-label="LM Scout home">
          <div class="flex size-8 items-center justify-center rounded-lg bg-foreground text-background"><Sparkles class="size-4" /></div>
          <span class="font-semibold tracking-tight">LM Scout</span>
        </a>
        <a href="/#models" class="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex">
          <ArrowLeft class="size-4" /> Models
        </a>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        onclick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {#if theme === 'dark'}<Sun class="size-4" />{:else}<Moon class="size-4" />{/if}
      </Button>
    </div>
  </header>

  <main>
    <section class="border-b">
      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav class="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <a href="/#models" class="hover:text-foreground">Models</a><span>/</span><span>{vendor}</span>
        </nav>

        <div class="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <div class="flex items-center gap-3">
              <ProviderLogo vendor={vendor} modelId={model.id} />
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{vendor}</p>
            </div>
            <h1 class="mt-5 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{displayName}</h1>
            <p class="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {cleanDescription(model.description) || 'This model is currently available through OpenRouter.'}
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onclick={copyModelId}>
                {#if copied}<Check class="size-4" /> Copied{:else}<Copy class="size-4" /> Copy model ID{/if}
              </Button>
              <a
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                href={`https://openrouter.ai/${model.id}`}
                target="_blank"
                rel="noreferrer"
              >Open on OpenRouter <ArrowUpRight class="size-4" /></a>
            </div>
          </div>

          <Card class="overflow-hidden shadow-none">
            <div class="border-b px-5 py-4">
              <p class="text-sm font-semibold">Model snapshot</p>
              <p class="mt-1 text-xs text-muted-foreground">Current catalog data</p>
            </div>
            <div class="grid grid-cols-3 gap-px bg-border">
              <div class="bg-card p-4"><Gauge class="size-4 text-muted-foreground" /><p class="mt-3 text-xs text-muted-foreground">Context</p><p class="mt-1 font-semibold">{formatContext(model.context_length)}</p></div>
              <div class="bg-card p-4"><Coins class="size-4 text-muted-foreground" /><p class="mt-3 text-xs text-muted-foreground">Input / M</p><p class="mt-1 font-semibold">{formatPrice(model.pricing?.prompt)}</p></div>
              <div class="bg-card p-4"><Zap class="size-4 text-muted-foreground" /><p class="mt-3 text-xs text-muted-foreground">Output / M</p><p class="mt-1 font-semibold">{formatPrice(model.pricing?.completion)}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
      <div class="min-w-0 space-y-6">
        <Card class="p-5 shadow-none sm:p-6">
          <h2 class="text-xl font-semibold tracking-tight">What it’s good for</h2>
          <p class="mt-2 text-sm text-muted-foreground">Practical use cases inferred from the model’s published capabilities and description.</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            {#each uses as use}
              <div class="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                <Check class="size-4 shrink-0" /><span class="text-sm font-medium">{use}</span>
              </div>
            {/each}
          </div>
        </Card>

        <Card class="p-5 shadow-none sm:p-6">
          <h2 class="text-xl font-semibold tracking-tight">Capabilities</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            {#each capabilities as capability}<Badge variant="outline">{capability}</Badge>{/each}
          </div>
          <div class="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div><p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Accepts</p><p class="mt-2 text-sm font-medium">{formatModality(inputs)}</p></div>
            <div><p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Returns</p><p class="mt-2 text-sm font-medium">{formatModality(outputs)}</p></div>
          </div>
        </Card>

        <Card class="overflow-hidden shadow-none">
          <div class="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <div><h2 class="text-xl font-semibold tracking-tight">API example</h2><p class="mt-1 text-sm text-muted-foreground">OpenRouter chat completions</p></div>
            <Braces class="size-5 text-muted-foreground" />
          </div>
          <pre class="overflow-x-auto bg-muted/35 p-5 text-xs leading-6 sm:p-6"><code>{codeSample}</code></pre>
        </Card>
      </div>

      <aside class="min-w-0 space-y-6">
        <Card class="p-5 shadow-none">
          <h2 class="font-semibold">Model details</h2>
          <dl class="mt-4 divide-y text-sm">
            <div class="grid gap-1 py-3 first:pt-0"><dt class="text-muted-foreground">Model ID</dt><dd class="break-all font-medium">{model.id}</dd></div>
            <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-foreground">Provider</dt><dd class="font-medium">{vendor}</dd></div>
            <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-foreground">Context window</dt><dd class="font-medium">{formatContext(model.context_length)} tokens</dd></div>
            <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-foreground">Architecture</dt><dd class="text-right font-medium">{model.architecture?.modality?.replace('->', ' → ') ?? 'text → text'}</dd></div>
            <div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-foreground">Catalog updated</dt><dd class="font-medium">{new Date(data.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</dd></div>
          </dl>
        </Card>

        <Card class="p-5 shadow-none">
          <div class="flex items-center gap-2"><Brain class="size-4" /><h2 class="font-semibold">Reasoning</h2></div>
          {#if reasoningEfforts.length}
            <p class="mt-3 text-sm leading-6 text-muted-foreground">Configurable effort levels supported by this model.</p>
            <div class="mt-4 flex flex-wrap gap-2">{#each reasoningEfforts as effort}<Badge variant="secondary">{effort === 'xhigh' ? 'Extra high' : effort.charAt(0).toUpperCase() + effort.slice(1)}</Badge>{/each}</div>
          {:else}
            <p class="mt-3 text-sm leading-6 text-muted-foreground">{reasoningAvailable ? 'Reasoning is supported with a fixed configuration.' : 'This model does not advertise reasoning support.'}</p>
          {/if}
        </Card>

        {#if data.related.length}
          <Card class="overflow-hidden shadow-none">
            <div class="border-b px-5 py-4"><h2 class="font-semibold">More from {vendor}</h2></div>
            <div class="divide-y">
              {#each data.related as related}
                <a class="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/45" href={detailHref(related.id)}>
                  <span class="min-w-0 truncate text-sm font-medium">{relatedName(related)}</span><ArrowUpRight class="size-4 shrink-0 text-muted-foreground" />
                </a>
              {/each}
            </div>
          </Card>
        {/if}
      </aside>
    </section>
  </main>
</div>
