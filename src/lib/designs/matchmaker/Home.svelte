<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import { ALL_TASKS, formatContext, formatPrice, modelHref, reasoningSummary, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  const budgets = [
    { value: 'any', label: 'any price' },
    { value: '0.5', label: '$0.50' },
    { value: '1', label: '$1' },
    { value: '3', label: '$3' },
    { value: '10', label: '$10' },
    { value: '30', label: '$30' }
  ];
  const reasoningNeeds = [
    { value: 'any', label: 'reasoning is optional' },
    { value: 'reasons', label: 'it should reason' },
    { value: 'adjustable', label: 'I can set its reasoning effort' }
  ];

  let budget = $state('any');
  let reasoningNeed = $state('any');
  let showAll = $state(false);

  const taskLabel = $derived(catalog.selectedTask === ALL_TASKS ? 'anything' : catalog.selectedTask.toLowerCase());
  const budgetLabel = $derived(budgets.find((option) => option.value === budget)?.label ?? 'any price');
  const reasoningLabel = $derived(reasoningNeeds.find((option) => option.value === reasoningNeed)?.label ?? '');

  // Typical cost assumes three input tokens for every output token.
  const typicalCost = (model: ModelCard) => (model.promptPrice * 3 + model.completionPrice) / 4;

  const matches = $derived(catalog.filtered
    .filter((model) => budget === 'any' || (model.promptPrice >= 0 && model.promptPrice * 1e6 <= Number(budget)))
    .filter((model) => reasoningNeed === 'any'
      || (reasoningNeed === 'reasons' ? model.reasoningAvailable : model.reasoningEfforts.length > 0))
    .sort((a, b) => {
      const costA = typicalCost(a) < 0 ? Infinity : typicalCost(a);
      const costB = typicalCost(b) < 0 ? Infinity : typicalCost(b);
      return costA - costB || b.contextLength - a.contextLength;
    }));
  const [best, ...rest] = $derived(matches);
  const runnersUp = $derived(showAll ? rest : rest.slice(0, 5));

  const why = (model: ModelCard) => {
    const fit = catalog.selectedTask !== ALL_TASKS ? `Suited to ${catalog.selectedTask.toLowerCase()}. ` : '';
    const cost = model.promptPrice === 0 && model.completionPrice === 0
      ? 'Free to use'
      : model.promptPrice < 0
        ? 'Pricing varies by request'
        : `Costs ${formatPrice(model.promptPrice)} in and ${formatPrice(model.completionPrice)} out per million tokens`;
    return `${fit}${cost}, and holds ${formatContext(model.contextLength)} tokens of context.`;
  };
</script>

{#snippet blank(label: string)}
  <span class="mm-blank-text">{label}</span>
{/snippet}

<div class="mm min-h-screen bg-background font-sans text-foreground">
  <header>
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <a href="/" class="font-display text-xl font-bold tracking-tight" aria-label="LM Scout home">LM Scout</a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="max-w-44 rounded-full bg-card" />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
    <section class="pt-10 pb-14 sm:pt-16" aria-label="Describe what you need">
      <p class="font-display text-[clamp(2rem,5.2vw,4.25rem)] leading-[1.18] font-medium tracking-[-0.025em]">
        I need a model for
        <Select.Root type="single" value={catalog.selectedTask} onValueChange={(value) => { catalog.selectedTask = value; showAll = false; }}>
          <Select.Trigger class="mm-blank" aria-label="Task">{@render blank(taskLabel)}</Select.Trigger>
          <Select.Content class="max-h-80">
            <Select.Item value={ALL_TASKS} label="Anything" />
            {#each catalog.tasks as task}<Select.Item value={task} label={task} />{/each}
          </Select.Content>
        </Select.Root>
        that costs under
        <Select.Root type="single" value={budget} onValueChange={(value) => { budget = value; showAll = false; }}>
          <Select.Trigger class="mm-blank" aria-label="Budget per million input tokens">{@render blank(budgetLabel)}</Select.Trigger>
          <Select.Content>
            {#each budgets as option}<Select.Item value={option.value} label={option.value === 'any' ? 'Any price' : option.label} />{/each}
          </Select.Content>
        </Select.Root>
        per million input tokens, and
        <span class="whitespace-nowrap"><Select.Root type="single" value={reasoningNeed} onValueChange={(value) => { reasoningNeed = value; showAll = false; }}>
          <Select.Trigger class="mm-blank" aria-label="Reasoning">{@render blank(reasoningLabel)}</Select.Trigger>
          <Select.Content>
            {#each reasoningNeeds as option}<Select.Item value={option.value} label={option.label.charAt(0).toUpperCase() + option.label.slice(1)} />{/each}
          </Select.Content>
        </Select.Root>.</span>
      </p>

      <label class="relative mt-10 block max-w-md">
        <span class="sr-only">Search by name instead</span>
        <Search class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input class="h-11 rounded-full bg-card pl-10" placeholder="Or search by name, or compare “A vs B”" bind:value={catalog.query} />
      </label>
    </section>

    <section id="models" class="scroll-mt-4" aria-live="polite">
      {#if catalog.loading}
        <p class="font-display text-2xl text-muted-foreground">Finding your matches…</p>
      {:else if catalog.loadError}
        <h2 class="font-display text-2xl font-bold">The catalog didn’t load</h2>
        <p class="mt-2 text-muted-foreground">{catalog.loadError}</p>
      {:else if catalog.comparison}
        <h2 class="font-display text-3xl font-bold tracking-tight">Your two candidates</h2>
        <div class="mt-6 grid gap-5 md:grid-cols-2">
          {#each catalog.comparison as model (model.id)}
            <article class="rounded-[var(--radius)] bg-card p-6">
              <div class="flex items-center gap-3"><ProviderLogo vendor={model.vendor} modelId={model.id} /><span class="text-sm text-muted-foreground">{model.vendor}</span></div>
              <h3 class="mt-4 font-display text-3xl font-bold tracking-tight"><a class="hover:underline" href={modelHref(model.id)}>{model.name}</a></h3>
              <p class="mt-3 leading-7 text-muted-foreground">{why(model)}</p>
              <p class="mt-3 text-sm">Reasoning: {reasoningSummary(model)}</p>
            </article>
          {/each}
        </div>
      {:else if best}
        <p class="text-sm text-muted-foreground">
          {matches.length} {matches.length === 1 ? 'model fits' : 'models fit'}. Ranked by typical cost, assuming three input tokens for every output token.
        </p>

        <article class="mm-best mt-4 grid gap-6 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div class="min-w-0">
            <h2 class="text-base font-semibold">Your best match</h2>
            <h3 class="mt-3 font-display text-5xl leading-[1.02] font-bold tracking-[-0.03em] break-words sm:text-6xl">
              <a class="hover:underline" href={modelHref(best.id)}>{best.name}</a>
            </h3>
            <p class="mt-5 max-w-[60ch] text-lg leading-8 opacity-85">{why(best)}</p>
            <p class="mt-4 line-clamp-3 max-w-[64ch] leading-7 opacity-70">{best.summary}</p>
          </div>
          <dl class="grid content-start gap-4 border-current/20 md:border-l md:pl-6">
            <div class="flex items-center gap-3"><span class="text-foreground"><ProviderLogo vendor={best.vendor} modelId={best.id} /></span><span class="font-semibold">{best.vendor}</span></div>
            <div><dt class="text-sm opacity-70">Reasoning</dt><dd class="text-lg font-semibold">{reasoningSummary(best)}</dd></div>
            <div><dt class="text-sm opacity-70">Good at</dt><dd class="font-semibold">{best.uses.join(', ')}</dd></div>
            <div><dt class="text-sm opacity-70">Capabilities</dt><dd class="font-semibold">{best.strengths.join(', ')}</dd></div>
          </dl>
        </article>

        {#if rest.length}
          <h2 class="mt-14 font-display text-2xl font-bold tracking-tight">Also worth a look</h2>
          <ol class="mt-4 divide-y divide-border border-y border-border">
            {#each runnersUp as model (model.id)}
              <li class="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div class="flex min-w-0 items-center gap-3">
                  <ProviderLogo vendor={model.vendor} modelId={model.id} size="sm" />
                  <div class="min-w-0">
                    <a class="font-display text-lg font-semibold hover:underline" href={modelHref(model.id)}>{model.name}</a>
                    <p class="truncate text-sm text-muted-foreground">{model.vendor}, {model.uses.slice(0, 2).join(' and ').toLowerCase()}</p>
                  </div>
                </div>
                <p class="text-sm tabular-nums text-muted-foreground sm:text-right">
                  {formatPrice(model.promptPrice)} in, {formatPrice(model.completionPrice)} out, {formatContext(model.contextLength)} context
                </p>
              </li>
            {/each}
          </ol>
          {#if rest.length > 5}
            <button type="button" class="mm-more mt-5" onclick={() => (showAll = !showAll)}>
              {showAll ? 'Show fewer' : `Show all ${rest.length} other matches`}
            </button>
          {/if}
        {/if}
      {:else}
        <h2 class="font-display text-3xl font-bold tracking-tight">Nothing fits all of that yet</h2>
        <p class="mt-3 max-w-[56ch] text-lg leading-8 text-muted-foreground">Raise the budget or relax the reasoning requirement, and the matches will appear here.</p>
      {/if}
    </section>
  </main>
</div>

<style>
  :global(.mm-blank) {
    display: inline-flex !important;
    height: auto !important;
    max-width: 100%;
    vertical-align: baseline;
    gap: 0.25em !important;
    border: 0 !important;
    border-radius: 0.2em !important;
    background: transparent !important;
    padding: 0 0.1em !important;
    box-shadow: inset 0 -0.14em 0 var(--lm-marigold) !important;
    font: inherit !important;
    letter-spacing: inherit;
    color: inherit !important;
    white-space: normal !important;
    cursor: pointer;
  }
  :global(.mm-blank:hover) {
    background: color-mix(in oklab, var(--lm-marigold) 22%, transparent) !important;
  }
  :global(.mm-blank:focus-visible) {
    outline: 3px solid var(--ring);
    outline-offset: 3px;
  }
  :global(.mm-blank svg) {
    margin-right: -0.1em;
    width: 0.45em !important;
    height: 0.45em !important;
    color: var(--muted-foreground) !important;
  }
  .mm-blank-text {
    font-weight: 700;
    text-align: left;
  }

  .mm-best {
    border-radius: calc(var(--radius) * 2);
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .mm-more {
    border-radius: 999px;
    border: 1px solid var(--input);
    padding: 0.5rem 1.125rem;
    font-weight: 600;
    cursor: pointer;
  }
  .mm-more:hover {
    background: var(--card);
  }
  .mm-more:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
</style>
