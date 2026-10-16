<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import Trophy from '@lucide/svelte/icons/trophy';
  import X from '@lucide/svelte/icons/x';
  import { Input } from '$lib/components/ui/input';
  import ProviderLogo from '$lib/components/ProviderLogo.svelte';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import { ALL_TASKS, ALL_VENDORS, formatContext, formatPrice, modelHref, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  type Stat = {
    key: string;
    label: string;
    value: (model: ModelCard) => number;
    format: (model: ModelCard) => string;
    prefer: 'higher' | 'lower';
  };

  const stats: Stat[] = [
    { key: 'context', label: 'Context window', value: (m) => m.contextLength, format: (m) => formatContext(m.contextLength), prefer: 'higher' },
    { key: 'input', label: 'Input per M', value: (m) => m.promptPrice, format: (m) => formatPrice(m.promptPrice), prefer: 'lower' },
    { key: 'output', label: 'Output per M', value: (m) => m.completionPrice, format: (m) => formatPrice(m.completionPrice), prefer: 'lower' },
    {
      key: 'reasoning',
      label: 'Reasoning levels',
      value: (m) => m.reasoningEfforts.length || (m.reasoningAvailable ? 1 : 0),
      format: (m) => m.reasoningEfforts.length ? String(m.reasoningEfforts.length) : m.reasoningAvailable ? 'Fixed' : 'None',
      prefer: 'higher'
    },
    { key: 'capabilities', label: 'Capabilities', value: (m) => m.strengths.length, format: (m) => String(m.strengths.length), prefer: 'higher' }
  ];

  // A negative price means "varies", which can't win or lose a round.
  const known = (stat: Stat, model: ModelCard) => stat.prefer === 'higher' || stat.value(model) >= 0;

  /** How this model ranks on a stat across the whole catalog, from 0 (worst) to 1 (best). */
  const strength = (stat: Stat, model: ModelCard) => {
    const values = catalog.models.filter((other) => known(stat, other)).map(stat.value);
    if (!known(stat, model) || values.length < 2) return 0;
    const value = stat.value(model);
    const worse = values.filter((other) => (stat.prefer === 'higher' ? other < value : other > value)).length;
    const equal = values.filter((other) => other === value).length - 1;
    return (worse + equal / 2) / (values.length - 1);
  };

  const winner = (stat: Stat, a: ModelCard, b: ModelCard): 0 | 1 | null => {
    if (!known(stat, a) || !known(stat, b)) return null;
    const first = stat.value(a);
    const second = stat.value(b);
    if (first === second) return null;
    return (stat.prefer === 'higher' ? first > second : first < second) ? 0 : 1;
  };

  let picks = $state<string[]>([]);

  const togglePick = (model: ModelCard) => {
    if (picks.includes(model.id)) {
      picks = picks.filter((id) => id !== model.id);
      return;
    }
    picks = [...picks, model.id].slice(-2);
    // With both slots filled, bring the result into view.
    if (picks.length === 2) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => document.getElementById('sc-arena')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' }));
    }
  };

  // Typing "A vs B" in the search fills the arena too.
  const arena = $derived<(ModelCard | undefined)[]>(
    catalog.comparison ?? [0, 1].map((slot) => catalog.models.find((model) => model.id === picks[slot]))
  );
  const rounds = $derived.by(() => {
    const [a, b] = arena;
    if (!a || !b) return null;
    return stats.map((stat) => ({ stat, winner: winner(stat, a, b) }));
  });
  const tally = $derived(rounds ? [0, 1].map((side) => rounds.filter((round) => round.winner === side).length) : [0, 0]);
</script>

{#snippet statRows(model: ModelCard)}
  <dl class="sc-stats">
    {#each stats as stat (stat.key)}
      <div>
        <dt>{stat.label}</dt>
        <dd class="tabular-nums">{stat.format(model)}</dd>
        <span class="sc-meter" aria-hidden="true"><span style={`width: ${Math.round(strength(stat, model) * 100)}%`}></span></span>
      </div>
    {/each}
  </dl>
{/snippet}

<div class="sc min-h-screen bg-background font-sans text-foreground">
  <header>
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <a href="/" class="flex items-center gap-2" aria-label="LM Scout home">
        <span class="sc-logo">LM</span>
        <span class="text-xl font-extrabold tracking-tight">Scout</span>
      </a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="sc-control max-w-44" />
        <ThemeToggle class="text-foreground hover:bg-white/15 hover:text-foreground" />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
    <section class="grid gap-10 pt-8 pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:pt-14">
      <div>
        <h1 class="sc-display text-6xl leading-[0.92] sm:text-7xl">Pick two models. See who wins.</h1>
        <p class="mt-6 max-w-[46ch] text-lg leading-8 text-white/80">
          Every card carries the same five stats. Choose any two from the deck and they go head to head, one stat at a time.
        </p>
      </div>

      <div id="sc-arena" class="sc-arena scroll-mt-4" aria-live="polite">
        <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
          {#each [0, 1] as slot}
            {@const model = arena[slot]}
            {#if slot === 1}<div class="sc-vs self-center" aria-hidden="true">vs</div>{/if}
            {#if model}
              {#key model.id}
                <div class="sc-slot sc-slot-filled">
                  <div class="flex items-start justify-between gap-2">
                    <ProviderLogo vendor={model.vendor} modelId={model.id} size="sm" />
                    {#if !catalog.comparison}
                      <button type="button" class="sc-remove" aria-label={`Remove ${model.name}`} onclick={() => togglePick(model)}><X class="size-4" /></button>
                    {/if}
                  </div>
                  <p class="mt-3 text-sm text-muted-foreground">{model.vendor}</p>
                  <p class="sc-display text-2xl leading-tight break-words">{model.name}</p>
                  {#if rounds}
                    <p class="mt-3 text-sm font-semibold" class:sc-lead={tally[slot] > tally[1 - slot]}>
                      {tally[slot]} of {stats.length} stats
                    </p>
                  {/if}
                </div>
              {/key}
            {:else}
              <div class="sc-slot sc-slot-empty">
                <p class="text-sm font-semibold">{slot === 0 ? 'First pick' : 'Second pick'}</p>
                <p class="mt-1 text-sm opacity-75">Choose a card below</p>
              </div>
            {/if}
          {/each}
        </div>

        {#if rounds && arena[0] && arena[1]}
          {@const a = arena[0]}
          {@const b = arena[1]}
          <table class="sc-rounds mt-4 w-full text-sm">
            <caption class="sr-only">Stat by stat result</caption>
            <tbody>
              {#each rounds as round (round.stat.key)}
                <tr>
                  <td class="text-right tabular-nums" class:sc-won={round.winner === 0}>
                    {#if round.winner === 0}<Trophy class="mr-1 inline size-3.5" aria-label="Wins" />{/if}{round.stat.format(a)}
                  </td>
                  <th scope="row">{round.stat.label}</th>
                  <td class="tabular-nums" class:sc-won={round.winner === 1}>
                    {round.stat.format(b)}{#if round.winner === 1}<Trophy class="ml-1 inline size-3.5" aria-label="Wins" />{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="mt-3 text-center text-sm text-white/80">
            {tally[0] === tally[1] ? 'A draw.' : `${tally[0] > tally[1] ? a.name : b.name} takes it.`}
            {#if catalog.comparison}Clear the search to pick your own.{:else}<button type="button" class="font-semibold underline underline-offset-4" onclick={() => (picks = [])}>Start over</button>{/if}
          </p>
        {/if}
      </div>
    </section>

    <section id="models" class="scroll-mt-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="sc-display text-4xl">The deck</h2>
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] md:w-[40rem]">
          <label class="relative block">
            <span class="sr-only">Search the deck</span>
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input class="sc-field pl-9" placeholder="Search, or try “A vs B”" bind:value={catalog.query} />
          </label>
          <label class="block">
            <span class="sr-only">Vendor</span>
            <select bind:value={catalog.selectedVendor} class="sc-field sc-select">
              <option value={ALL_VENDORS}>All vendors</option>
              {#each catalog.vendors as vendor}<option>{vendor}</option>{/each}
            </select>
          </label>
          <label class="block">
            <span class="sr-only">Task</span>
            <select bind:value={catalog.selectedTask} class="sc-field sc-select">
              <option value={ALL_TASKS}>All tasks</option>
              {#each catalog.tasks as task}<option>{task}</option>{/each}
            </select>
          </label>
        </div>
      </div>
      <p class="mt-3 text-sm text-white/75">Each bar shows where a stat ranks across the whole deck. Longer is better: more context, lower prices.</p>

      {#if catalog.loading}
        <p class="mt-10 text-lg font-semibold">Shuffling the deck…</p>
      {:else if catalog.loadError}
        <div class="mt-10"><p class="text-lg font-semibold">The deck didn’t load</p><p class="mt-1 text-white/80">{catalog.loadError}</p></div>
      {:else}
        <ul class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {#each catalog.comparison ?? catalog.filtered as model (model.id)}
            {@const picked = picks.includes(model.id)}
            <li class="sc-card" class:sc-card-picked={picked}>
              <div class="sc-card-head">
                <ProviderLogo vendor={model.vendor} modelId={model.id} size="sm" />
                <span class="truncate text-sm font-medium">{model.vendor}</span>
              </div>
              <div class="px-4 pt-3">
                <h3 class="sc-display text-[1.6rem] leading-[1.05] break-words">
                  <a class="hover:underline" href={modelHref(model.id)}>{model.name}</a>
                </h3>
                <p class="mt-1 text-xs text-muted-foreground">{model.uses.slice(0, 2).join(', ')}</p>
              </div>
              <div class="flex-1 px-4 py-3">{@render statRows(model)}</div>
              {#if !catalog.comparison}
                <button type="button" class="sc-pick" aria-pressed={picked} onclick={() => togglePick(model)}>
                  {picked ? 'Picked' : 'Pick this card'}
                </button>
              {/if}
            </li>
          {:else}
            <li class="col-span-full py-10 text-lg font-semibold">No cards match. Try another vendor or task.</li>
          {/each}
        </ul>
      {/if}
    </section>
  </main>
</div>

<style>
  .sc-display {
    font-weight: 800;
    font-variation-settings: 'opsz' 96;
    letter-spacing: -0.03em;
  }
  .sc-logo {
    display: inline-grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.75rem;
    background: var(--lm-sun);
    color: #14163a;
    font-weight: 800;
    rotate: -6deg;
  }

  .sc-arena {
    border-radius: 1.5rem;
    background: rgb(255 255 255 / 10%);
    padding: 1rem;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
  }
  .sc-vs {
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 999px;
    background: var(--lm-sun);
    color: #14163a;
    font-weight: 800;
  }
  .sc-slot {
    min-height: 9.5rem;
    border-radius: 1rem;
    padding: 1rem;
  }
  .sc-slot-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 2px dashed rgb(255 255 255 / 40%);
    text-align: center;
  }
  .sc-slot-filled {
    background: var(--card);
    color: var(--card-foreground);
    animation: sc-deal 320ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
  }
  @keyframes sc-deal {
    from {
      transform: translateY(12px) rotate(-3deg) scale(0.96);
      opacity: 0;
    }
  }
  .sc-lead {
    display: inline-block;
    border-radius: 999px;
    background: var(--lm-sun);
    color: #14163a;
    padding: 0.125rem 0.625rem;
  }
  .sc-remove {
    border-radius: 999px;
    padding: 0.25rem;
    color: var(--muted-foreground);
    cursor: pointer;
  }
  .sc-remove:hover {
    background: var(--muted);
    color: var(--card-foreground);
  }

  .sc-rounds {
    border-collapse: separate;
    border-spacing: 0 4px;
  }
  .sc-rounds th,
  .sc-rounds td {
    padding: 0.5rem 0.75rem;
    background: rgb(255 255 255 / 8%);
  }
  .sc-rounds th {
    width: 38%;
    font-weight: 500;
    color: rgb(255 255 255 / 80%);
    text-align: center;
  }
  .sc-rounds td:first-child {
    border-radius: 0.625rem 0 0 0.625rem;
  }
  .sc-rounds td:last-child {
    border-radius: 0 0.625rem 0.625rem 0;
  }
  .sc-rounds .sc-won {
    background: var(--lm-sun);
    color: #14163a;
    font-weight: 700;
  }

  :global(.sc-field) {
    background: var(--card) !important;
    color: var(--card-foreground);
    border-color: transparent !important;
  }
  .sc-select {
    height: 2.5rem;
    width: 100%;
    border-radius: 0.75rem;
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }
  :global(.sc-control) {
    border-color: transparent !important;
    background: rgb(255 255 255 / 14%) !important;
    color: var(--foreground) !important;
  }

  .sc-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 1.25rem;
    background: var(--card);
    color: var(--card-foreground);
    box-shadow: 0 0 0 4px var(--lm-card-edge);
    transition: transform 160ms ease, box-shadow 160ms ease;
  }
  .sc-card-picked {
    box-shadow: 0 0 0 4px var(--lm-sun);
    transform: translateY(-4px);
  }
  .sc-card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid var(--lm-card-edge);
    background: var(--muted);
    padding: 0.625rem 1rem;
  }
  .sc-card-head :global([data-logo-source]),
  .sc-slot-filled :global([data-logo-source]) {
    background: var(--card);
  }
  .sc-stats {
    display: grid;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  .sc-stats div {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }
  .sc-stats dt {
    color: var(--muted-foreground);
  }
  .sc-stats dd {
    font-weight: 700;
  }
  .sc-meter {
    grid-column: 1 / -1;
    height: 0.3rem;
    border-radius: 999px;
    background: var(--muted);
  }
  .sc-meter span {
    display: block;
    height: 100%;
    min-width: 0.3rem;
    border-radius: inherit;
    background: #2442d1;
  }
  :global(.dark) .sc-meter span {
    background: #8fa2ff;
  }
  .sc-pick {
    margin: 0 1rem 1rem;
    border-radius: 0.75rem;
    background: var(--lm-ink);
    color: var(--card);
    padding: 0.625rem;
    font-weight: 700;
    cursor: pointer;
  }
  .sc-pick[aria-pressed='true'] {
    background: var(--lm-sun);
    color: #14163a;
  }
  .sc-pick:focus-visible,
  .sc-remove:focus-visible {
    outline: 3px solid var(--lm-sun);
    outline-offset: 2px;
  }
</style>
