<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import { Input } from '$lib/components/ui/input';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import { ALL_TASKS, ALL_VENDORS, formatContext, formatPrice, modelHref, reasoningSummary, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  // Entries are grouped by the family (vendor) that made them, like a field guide's sections.
  const families = $derived.by(() => {
    const groups = new Map<string, ModelCard[]>();
    for (const model of catalog.filtered) groups.set(model.vendor, [...(groups.get(model.vendor) ?? []), model]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  });
  const familyCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const model of catalog.models) counts.set(model.vendor, (counts.get(model.vendor) ?? 0) + 1);
    return counts;
  });

  const chooseFamily = (vendor: string) => {
    catalog.selectedVendor = catalog.selectedVendor === vendor ? ALL_VENDORS : vendor;
  };
  const entryWord = (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`;
</script>

{#snippet measurements(model: ModelCard)}
  <dl class="fg-measure grid grid-cols-4 border-y border-border text-sm">
    <div><dt>Context</dt><dd>{formatContext(model.contextLength)}</dd></div>
    <div><dt>Input per M</dt><dd>{formatPrice(model.promptPrice)}</dd></div>
    <div><dt>Output per M</dt><dd>{formatPrice(model.completionPrice)}</dd></div>
    <div><dt>Reasoning</dt><dd>{reasoningSummary(model)}</dd></div>
  </dl>
{/snippet}

{#snippet entry(model: ModelCard)}
  <article class="grid gap-x-6 gap-y-4 py-8 sm:grid-cols-[7rem_minmax(0,1fr)]">
    <div class="fg-plate flex aspect-square w-20 items-center justify-center sm:w-28 [&>*]:scale-125 sm:[&>*]:scale-150" aria-hidden="true">
      <ProviderLogo vendor={model.vendor} modelId={model.id} />
    </div>
    <div class="min-w-0">
      <h3 class="font-display text-[1.75rem] leading-tight font-bold italic">
        <a class="underline-offset-4 hover:underline" href={modelHref(model.id)}>{model.name}</a>
      </h3>
      <p class="mt-1 text-sm text-muted-foreground">{model.configuration}</p>
      <p class="mt-4 max-w-[68ch] font-display text-[1.0625rem] leading-7">{model.summary}</p>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 class="font-display text-sm font-bold italic">Habitat</h4>
          <p class="mt-1 text-sm leading-6">
            {#each model.uses as use, index}
              <span class:fg-marked={use === catalog.selectedTask}>{use}</span>{index < model.uses.length - 1 ? ', ' : ''}
            {/each}
          </p>
        </div>
        <div>
          <h4 class="font-display text-sm font-bold italic">Distinguishing traits</h4>
          <p class="mt-1 text-sm leading-6">{model.strengths.join(', ')}</p>
        </div>
      </div>

      <div class="mt-5">{@render measurements(model)}</div>
    </div>
  </article>
{/snippet}

<div class="fg min-h-screen bg-background font-sans text-foreground">
  <header class="border-b border-border">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <a href="/" class="flex min-w-0 items-baseline gap-3" aria-label="LM Scout home">
        <span class="font-display text-2xl font-bold italic">LM Scout</span>
        <span class="hidden truncate text-sm text-muted-foreground sm:inline">Field guide to language models</span>
      </a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="max-w-44 bg-card" />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 sm:px-6">
    <section class="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
      <div>
        <h1 class="font-display text-5xl leading-[1.02] font-bold tracking-[-0.01em] sm:text-6xl lg:text-7xl">
          Identify the right model in the wild.
        </h1>
        <p class="mt-6 max-w-[56ch] text-lg leading-8 text-muted-foreground">
          Every model in the catalog has an entry: where it does its best work, the traits that set it apart, and what it costs to run.
        </p>
      </div>

      <aside class="fg-key border-l-4 border-primary bg-card px-5 py-4" aria-labelledby="fg-key-title">
        <h2 id="fg-key-title" class="font-display text-lg font-bold italic">How to read an entry</h2>
        <dl class="mt-3 space-y-2 text-sm leading-6">
          <div><dt class="inline font-bold">Habitat</dt> <dd class="inline text-muted-foreground">the jobs it suits best.</dd></div>
          <div><dt class="inline font-bold">Distinguishing traits</dt> <dd class="inline text-muted-foreground">capabilities such as vision, tool use, or reasoning.</dd></div>
          <div><dt class="inline font-bold">Measurements</dt> <dd class="inline text-muted-foreground">context window, and price per million tokens in and out.</dd></div>
        </dl>
      </aside>
    </section>

    <section id="models" class="scroll-mt-4 border-t border-border pb-20">
      <div class="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <label class="relative block">
          <span class="sr-only">Look up a model</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input class="h-11 bg-card pl-9 text-base" placeholder="Look up a model, family, or trait, or try “A vs B”" bind:value={catalog.query} />
        </label>
        <label class="block">
          <span class="sr-only">Habitat</span>
          <select bind:value={catalog.selectedTask} class="h-11 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value={ALL_TASKS}>Any habitat</option>
            {#each catalog.tasks as task}<option>{task}</option>{/each}
          </select>
        </label>
      </div>

      <div class="grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav class="lg:sticky lg:top-4 lg:self-start" aria-label="Families">
          <h2 class="font-display text-lg font-bold italic">Families</h2>
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:flex-col lg:gap-0">
            <li>
              <button type="button" class="fg-family" aria-pressed={catalog.selectedVendor === ALL_VENDORS} onclick={() => (catalog.selectedVendor = ALL_VENDORS)}>
                <span>All families</span><span class="tabular-nums">{catalog.models.length}</span>
              </button>
            </li>
            {#each catalog.vendors as vendor}
              <li>
                <button type="button" class="fg-family" aria-pressed={catalog.selectedVendor === vendor} onclick={() => chooseFamily(vendor)}>
                  <span>{vendor}</span><span class="tabular-nums">{familyCounts.get(vendor)}</span>
                </button>
              </li>
            {/each}
          </ul>
        </nav>

        <div class="min-w-0">
          {#if catalog.loading}
            <p class="py-16 font-display text-xl italic text-muted-foreground">Gathering entries from the catalog…</p>
          {:else if catalog.loadError}
            <div class="py-16">
              <h2 class="font-display text-2xl font-bold italic">The catalog didn’t load</h2>
              <p class="mt-2 text-muted-foreground">{catalog.loadError}</p>
            </div>
          {:else if catalog.comparison}
            <section aria-labelledby="fg-compare">
              <h2 id="fg-compare" class="font-display text-3xl font-bold">Side by side</h2>
              <p class="mt-1 text-sm text-muted-foreground">Clear the search to return to the full guide.</p>
              <div class="grid gap-x-10 md:grid-cols-2">
                {#each catalog.comparison as model (model.id)}
                  <div class="border-t-4 border-primary mt-6">{@render entry(model)}</div>
                {/each}
              </div>
            </section>
          {:else}
            {#each families as [vendor, models] (vendor)}
              <section aria-labelledby={`fg-family-${vendor}`} class="mb-6">
                <div class="flex items-baseline justify-between gap-4 border-b-2 border-foreground pb-2">
                  <h2 id={`fg-family-${vendor}`} class="font-display text-3xl font-bold">{vendor}</h2>
                  <span class="text-sm text-muted-foreground">{entryWord(models.length)}</span>
                </div>
                <div class="divide-y divide-border">
                  {#each models as model (model.id)}{@render entry(model)}{/each}
                </div>
              </section>
            {:else}
              <div class="py-16">
                <h2 class="font-display text-2xl font-bold italic">No entries match</h2>
                <p class="mt-2 text-muted-foreground">Try a different family or habitat, or search by a trait like “vision”.</p>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-border">
    <p class="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">LM Scout field guide. Prices are per million tokens, from the live catalog.</p>
  </footer>
</div>

<style>
  .fg-plate {
    border: 1px solid var(--border);
    background:
      repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in oklab, var(--foreground) 5%, transparent) 7px 8px),
      var(--card);
    box-shadow: inset 0 0 0 4px var(--card);
  }

  .fg-measure > div {
    padding: 0.625rem 0.75rem 0.625rem 0;
  }
  .fg-measure > div + div {
    padding-left: 0.75rem;
    border-left: 1px solid var(--border);
  }
  .fg-measure dt {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .fg-measure dd {
    margin-top: 0.125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 30rem) {
    .fg-measure {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .fg-measure > div:nth-child(3) {
      padding-left: 0;
      border-left: 0;
    }
  }

  .fg-marked {
    background: linear-gradient(transparent 55%, var(--lm-marker) 55% 92%, transparent 92%);
  }

  .fg-family {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.3rem 0;
    color: var(--muted-foreground);
    text-align: left;
    cursor: pointer;
  }
  .fg-family:hover {
    color: var(--foreground);
  }
  .fg-family[aria-pressed='true'] {
    color: var(--foreground);
    font-weight: 700;
  }
  .fg-family[aria-pressed='true'] span:first-child {
    background: linear-gradient(transparent 55%, var(--lm-marker) 55% 92%, transparent 92%);
  }
  .fg-family:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
</style>
