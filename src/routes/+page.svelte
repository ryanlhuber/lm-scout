<script lang="ts">
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

  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';

  type ModelCard = {
    id: number;
    family: string;
    vendor: string;
    configuration: string;
    overall: number;
    efficiency: number;
    speed: number;
    price: string;
    summary: string;
    strengths: string[];
    accent: string;
  };

  const models: ModelCard[] = [
    {
      id: 1,
      family: 'GPT family',
      vendor: 'OpenAI',
      configuration: 'Medium reasoning',
      overall: 9.0,
      efficiency: 8.5,
      speed: 8.0,
      price: 'Sample pricing',
      summary: 'Balanced quality, planning depth, and agentic work for demanding general-purpose tasks.',
      strengths: ['Agentic Coding', 'Architecture', 'Research', 'Long-Context'],
      accent: 'bg-emerald-500'
    },
    {
      id: 2,
      family: 'Claude family',
      vendor: 'Anthropic',
      configuration: 'High reasoning',
      overall: 8.5,
      efficiency: 8.0,
      speed: 7.5,
      price: 'Sample pricing',
      summary: 'Strong fit for code review, writing, UX reasoning, and careful repository-level work.',
      strengths: ['Code Review', 'Writing', 'UX Reasoning', 'Refactoring'],
      accent: 'bg-orange-500'
    },
    {
      id: 3,
      family: 'Gemini family',
      vendor: 'Google',
      configuration: 'Standard reasoning',
      overall: 8.5,
      efficiency: 8.5,
      speed: 8.5,
      price: 'Sample pricing',
      summary: 'A versatile option for multimodal tasks, research, quick analysis, and broad assistant use.',
      strengths: ['Multimodal', 'Research', 'Data Analysis', 'Quick Questions'],
      accent: 'bg-blue-500'
    }
  ];

  let query = '';
  let selectedTask = 'All tasks';
  let selectedVendor = 'All vendors';
  let mobileFiltersOpen = false;

  $: filteredModels = models.filter((model) => {
    const matchesQuery = `${model.family} ${model.vendor} ${model.configuration} ${model.strengths.join(' ')}`
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
          <a href="#compare" class="transition-colors hover:text-foreground">Compare</a>
          <a href="#methodology" class="transition-colors hover:text-foreground">Methodology</a>
        </nav>
      </div>

      <div class="hidden items-center gap-2 sm:flex">
        <Badge variant="outline">Prototype data</Badge>
        <Button variant="outline" size="sm">
          <GitCompareArrows />
          Compare
        </Button>
      </div>

      <Button class="sm:hidden" variant="ghost" size="icon" aria-label="Open navigation">
        <Menu />
      </Button>
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
              Compare model quality, reasoning effort, speed, token efficiency, pricing, providers, and harness support without digging through dense benchmark tables.
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

    <section id="models" class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div class="flex flex-col gap-5 border-b pb-6">
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Explore models</h2>
              <Badge variant="secondary">{models.length} samples</Badge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              Ratings and pricing below are illustrative placeholders for the initial UI only.
            </p>
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
              <option>OpenAI</option>
              <option>Anthropic</option>
              <option>Google</option>
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
              <option>Agentic Coding</option>
              <option>Code Review</option>
              <option>Architecture</option>
              <option>Writing</option>
              <option>UX Reasoning</option>
              <option>Research</option>
              <option>Multimodal</option>
              <option>Data Analysis</option>
              <option>Quick Questions</option>
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

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        {#each filteredModels as model}
          <Card class="group flex h-full flex-col overflow-hidden shadow-none transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
              <div class="flex min-w-0 items-start gap-3">
                <div class={`mt-1 size-2.5 shrink-0 rounded-full ${model.accent}`}></div>
                <div class="min-w-0">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{model.vendor}</p>
                  <h3 class="mt-1 truncate text-xl font-semibold tracking-tight">{model.family}</h3>
                  <p class="mt-1 text-sm text-muted-foreground">{model.configuration}</p>
                </div>
              </div>
              <button class="flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-accent" aria-label={`Open ${model.family}`}>
                <ArrowUpRight class="size-4" />
              </button>
            </div>

            <div class="flex flex-1 flex-col p-5 sm:p-6">
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles class="size-3.5" />Overall</div>
                  <p class="mt-2 text-2xl font-semibold tabular-nums">{model.overall.toFixed(1)}</p>
                </div>
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Gauge class="size-3.5" />Efficiency</div>
                  <p class="mt-2 text-2xl font-semibold tabular-nums">{model.efficiency.toFixed(1)}</p>
                </div>
                <div class="rounded-lg bg-muted/55 p-3">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Zap class="size-3.5" />Speed</div>
                  <p class="mt-2 text-2xl font-semibold tabular-nums">{model.speed.toFixed(1)}</p>
                </div>
              </div>

              <p class="mt-5 text-sm leading-6 text-muted-foreground">{model.summary}</p>

              <div class="mt-5">
                <p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Strongest for</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  {#each model.strengths as strength}
                    <Badge variant="outline">{strength}</Badge>
                  {/each}
                </div>
              </div>

              <div class="mt-6 flex items-center justify-between border-t pt-4">
                <div>
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground"><Coins class="size-3.5" />API cost</div>
                  <p class="mt-1 text-sm font-medium">{model.price}</p>
                </div>
                <Button variant="ghost" size="sm">Compare</Button>
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
              <p class="mt-2 text-sm text-muted-foreground">Try another vendor, task, or search term.</p>
            </div>
          </Card>
        {/each}
      </div>
    </section>

    <section id="compare" class="border-y bg-muted/25">
      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Reasoning effort is part of the model.</h2>
            <p class="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Compare the same model at different effort levels, or compare configurations across vendors. Higher reasoning is not always the best value.
            </p>
          </div>

          <Card class="grid gap-5 p-5 shadow-none sm:grid-cols-2 sm:p-6">
            <div>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold">Reasoning effort</p>
                  <p class="text-xs text-muted-foreground">Normalized LM Scout scale</p>
                </div>
                <Badge>Medium</Badge>
              </div>
              <div class="mt-5 grid grid-cols-5 gap-1.5" aria-label="Reasoning effort scale">
                {#each ['Low', 'Med', 'High', 'Max', 'Ultra'] as level, index}
                  <button class={`h-2 rounded-full ${index === 1 ? 'bg-foreground' : 'bg-muted'}`} aria-label={level}></button>
                {/each}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 border-t pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <div>
                <p class="text-xs text-muted-foreground">Quality</p>
                <p class="mt-1 font-semibold">9.0</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Speed</p>
                <p class="mt-1 font-semibold">8.0</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Value</p>
                <p class="mt-1 font-semibold">8.5</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>

    <section id="methodology" class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-semibold tracking-tight">Useful scores, with the evidence behind them.</h2>
          <p class="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            LM Scout is designed to separate measured facts from comparative judgment, preserve sources, label estimates, and make recommendations explainable.
          </p>
        </div>
        <Button variant="outline">View methodology <ArrowUpRight /></Button>
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