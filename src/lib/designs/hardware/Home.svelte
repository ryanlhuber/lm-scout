<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import DesignSwitcher from '$lib/designs/DesignSwitcher.svelte';
  import ThemeToggle from '$lib/designs/ThemeToggle.svelte';
  import Knob from './Knob.svelte';
  import { ALL_TASKS, ALL_VENDORS, effortLabel, formatContext, formatPrice, modelHref, reasoningSummary, type ModelCard } from '$lib/catalog';
  import type { Catalog } from '$lib/catalog-state.svelte';

  let { catalog }: { catalog: Catalog } = $props();

  // Four encoders, color-coded by job: blue picks the vendor, green the task, white the order, orange the reasoning.
  const vendorOptions = $derived([ALL_VENDORS, ...catalog.vendors]);
  const taskOptions = $derived([ALL_TASKS, ...catalog.tasks]);
  const sorts = [
    { label: 'name', compare: (a: ModelCard, b: ModelCard) => a.name.localeCompare(b.name) },
    { label: 'most context', compare: (a: ModelCard, b: ModelCard) => b.contextLength - a.contextLength },
    { label: 'cheapest', compare: (a: ModelCard, b: ModelCard) => price(a) - price(b) },
    { label: 'most reasoning', compare: (a: ModelCard, b: ModelCard) => b.reasoningEfforts.length - a.reasoningEfforts.length }
  ];
  const reasoningModes = ['any', 'reasons', 'adjustable'];
  let sortIndex = $state(0);
  let reasoningIndex = $state(0);

  // A negative price means "varies"; it sorts after everything priced.
  const price = (model: ModelCard) => model.promptPrice < 0 ? Infinity : model.promptPrice;
  const knobLabel = (value: string) => value.toLowerCase();

  const models = $derived((catalog.comparison ?? catalog.filtered)
    .filter((model) => reasoningIndex === 0
      || (reasoningIndex === 1 ? model.reasoningAvailable : model.reasoningEfforts.length > 0))
    .sort(sorts[sortIndex].compare));

  let selectedId = $state<string | null>(null);
  const selected = $derived(models.find((model) => model.id === selectedId) ?? models[0]);
  const onScreen = $derived(catalog.comparison ?? (selected ? [selected] : []));
  const isOnScreen = (model: ModelCard) => onScreen.some((entry) => entry.id === model.id);

  /** Position of a value on a log scale across the catalog, 0 to 1, for the display meters. */
  const logShare = (value: number, values: number[]) => {
    const usable = values.filter((entry) => entry > 0);
    if (value <= 0 || usable.length < 2) return 0;
    const min = Math.log(Math.min(...usable));
    const max = Math.log(Math.max(...usable));
    return max === min ? 1 : (Math.log(value) - min) / (max - min);
  };
  const SEGMENTS = 12;
  const lit = (share: number) => Math.max(share > 0 ? 1 : 0, Math.round(share * SEGMENTS));
  const meters = (model: ModelCard) => [
    { label: 'context', value: formatContext(model.contextLength), level: lit(logShare(model.contextLength, catalog.models.map((m) => m.contextLength))) },
    { label: 'input', value: formatPrice(model.promptPrice), level: lit(logShare(model.promptPrice, catalog.models.map((m) => m.promptPrice))) },
    { label: 'output', value: formatPrice(model.completionPrice), level: lit(logShare(model.completionPrice, catalog.models.map((m) => m.completionPrice))) }
  ];
</script>

{#snippet readout(model: ModelCard, compact: boolean)}
  <div class="min-w-0">
    <p class="hw-screen-dim truncate text-xs">{model.vendor.toLowerCase()}</p>
    <p class="hw-readout mt-1 break-words" class:hw-readout-compact={compact}>{model.name}</p>
    <dl class="mt-4 grid max-w-[30rem] gap-1.5 lowercase">
      {#each meters(model) as meter (meter.label)}
        <div class="grid grid-cols-[3.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-xs">
          <dt class="hw-screen-dim">{meter.label}</dt>
          <span class="hw-meter" aria-hidden="true">
            {#each Array.from({ length: SEGMENTS }, (_, index) => index) as segment}
              <span class:hw-on={segment < meter.level} class:hw-tip={segment === meter.level - 1}></span>
            {/each}
          </span>
          <dd class="text-right tabular-nums">{meter.value}</dd>
        </div>
      {/each}
      <div class="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2 text-xs">
        <dt class="hw-screen-dim">reasoning</dt>
        <dd class="flex flex-wrap items-center gap-1">
          {#if model.reasoningEfforts.length}
            {#each model.reasoningEfforts as effort, index}
              <span class="hw-level" class:hw-level-default={index === model.reasoningLevel} title={effortLabel(effort)}>{effortLabel(effort).toLowerCase()}</span>
            {/each}
          {:else}
            <span>{reasoningSummary(model).toLowerCase()}</span>
          {/if}
        </dd>
      </div>
    </dl>
    <a class="hw-open mt-4" href={modelHref(model.id)}>open {model.name.toLowerCase()}</a>
  </div>
{/snippet}

<div class="hw min-h-screen bg-background font-sans text-foreground">
  <header>
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <a href="/" class="flex items-center gap-2" aria-label="LM Scout home">
        <span class="hw-led" aria-hidden="true"></span>
        <span class="text-sm font-semibold">lm scout</span>
        <span class="hidden text-sm text-muted-foreground sm:inline">model selector</span>
      </a>
      <div class="flex items-center gap-1.5">
        <DesignSwitcher class="max-w-44 bg-card" />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
    <section class="pt-8 pb-8 sm:pt-12">
      <h1 class="max-w-[20ch] text-4xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl">a pocket instrument for choosing models.</h1>
      <p class="mt-4 max-w-[54ch] text-base leading-7 text-muted-foreground">
        turn the knobs to filter and sort. press a key to load that model into the display.
      </p>
    </section>

    <section id="models" class="hw-device scroll-mt-4" aria-label="Model selector">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div class="hw-screen" aria-live="polite">
          <div class="mb-4 flex items-center justify-between gap-3 text-xs">
            <span class="hw-screen-dim">{catalog.comparison ? 'compare' : 'model'}</span>
            <span class="tabular-nums">{catalog.loading ? '--' : models.length}/{catalog.loading ? '--' : catalog.models.length}</span>
          </div>
          {#if catalog.loading}
            <p class="hw-readout hw-blink">loading</p>
          {:else if catalog.loadError}
            <p class="hw-readout">no signal</p>
            <p class="hw-screen-dim mt-2 text-sm">{catalog.loadError}</p>
          {:else if onScreen.length}
            <div class={`grid gap-6 ${onScreen.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {#each onScreen as model (model.id)}{@render readout(model, onScreen.length > 1)}{/each}
            </div>
          {:else}
            <p class="hw-readout">empty</p>
            <p class="hw-screen-dim mt-2 text-sm">nothing matches. turn a knob back toward “all”.</p>
          {/if}
        </div>

        <div class="grid grid-cols-2 content-start gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-2" role="group" aria-label="Controls">
          <Knob
            label="vendor"
            color="var(--lm-blue)"
            options={vendorOptions.map(knobLabel)}
            bind:index={() => Math.max(0, vendorOptions.indexOf(catalog.selectedVendor)), (i) => (catalog.selectedVendor = vendorOptions[i] ?? ALL_VENDORS)}
          />
          <Knob
            label="task"
            color="var(--lm-green)"
            options={taskOptions.map(knobLabel)}
            bind:index={() => Math.max(0, taskOptions.indexOf(catalog.selectedTask)), (i) => (catalog.selectedTask = taskOptions[i] ?? ALL_TASKS)}
          />
          <Knob label="sort" color="var(--lm-white)" light options={sorts.map((sort) => sort.label)} bind:index={sortIndex} />
          <Knob label="reasoning" color="var(--lm-orange)" options={reasoningModes} bind:index={reasoningIndex} />
        </div>
      </div>

      <label class="mt-5 block">
        <span class="sr-only">Search models</span>
        <Input class="hw-search" placeholder="search, or “a vs b” to compare" bind:value={catalog.query} />
      </label>

      <div class="hw-keypad mt-5" role="group" aria-label="Models">
        {#each models as model (model.id)}
          <button type="button" class="hw-key" aria-pressed={isOnScreen(model)} onclick={() => (selectedId = model.id)}>
            <span class="hw-key-name">{model.name.toLowerCase()}</span>
            <span class="hw-key-vendor">{model.vendor.toLowerCase()}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="pt-14" aria-labelledby="hw-specs">
      <div class="flex items-baseline justify-between gap-4">
        <h2 id="hw-specs" class="text-2xl font-semibold tracking-[-0.02em]">specifications</h2>
        <span class="text-sm text-muted-foreground">sorted by {sorts[sortIndex].label}</span>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="hw-specs w-full min-w-[40rem] text-sm">
          <thead>
            <tr>
              <th scope="col">model</th>
              <th scope="col" class="text-right">context</th>
              <th scope="col" class="text-right">input per m</th>
              <th scope="col" class="text-right">output per m</th>
              <th scope="col">reasoning</th>
            </tr>
          </thead>
          <tbody>
            {#each models as model (model.id)}
              <tr class:hw-row-selected={isOnScreen(model)}>
                <th scope="row">
                  <a class="font-medium hover:underline" href={modelHref(model.id)}>{model.name}</a>
                  <span class="block text-xs font-normal text-muted-foreground">{model.vendor}</span>
                </th>
                <td class="text-right tabular-nums">{formatContext(model.contextLength)}</td>
                <td class="text-right tabular-nums">{formatPrice(model.promptPrice)}</td>
                <td class="text-right tabular-nums">{formatPrice(model.completionPrice)}</td>
                <td>{reasoningSummary(model).toLowerCase()}</td>
              </tr>
            {:else}
              <tr><td colspan="5" class="py-8 text-center text-muted-foreground">{catalog.loading ? 'loading…' : 'no models match.'}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>

<style>
  .hw-led {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    background: var(--lm-orange);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--lm-orange) 22%, transparent);
  }

  .hw-device {
    border-radius: 1.75rem;
    background: linear-gradient(180deg, color-mix(in oklab, var(--lm-body) 92%, white) 0%, var(--lm-body) 100%);
    padding: 1.25rem;
    box-shadow: inset 0 0 0 1px var(--lm-body-edge), inset 0 1px 0 rgb(255 255 255 / 45%), 0 18px 40px -24px rgb(0 0 0 / 45%);
  }
  @media (min-width: 640px) {
    .hw-device {
      padding: 1.75rem;
    }
  }

  .hw-screen {
    min-height: 15rem;
    border-radius: 0.75rem;
    background: var(--lm-screen);
    color: var(--lm-screen-ink);
    padding: 1.25rem;
    box-shadow: inset 0 0 0 6px #000, inset 0 2px 12px rgb(0 0 0 / 60%);
  }
  .hw-screen-dim {
    color: var(--lm-screen-dim);
  }
  .hw-readout {
    font-family: var(--lm-font-readout);
    font-size: clamp(2rem, 5vw, 3.25rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: lowercase;
  }
  .hw-readout-compact {
    font-size: clamp(1.5rem, 3.5vw, 2.25rem);
  }
  .hw-blink {
    animation: hw-blink 1s steps(2, start) infinite;
  }
  @keyframes hw-blink {
    to {
      visibility: hidden;
    }
  }
  .hw-meter {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 2px;
    height: 0.625rem;
  }
  .hw-meter span {
    border-radius: 1px;
    background: #262725;
  }
  .hw-meter span.hw-on {
    background: var(--lm-screen-ink);
  }
  .hw-meter span.hw-tip {
    background: var(--lm-orange);
  }
  .hw-level {
    border: 1px solid #3a3b38;
    border-radius: 3px;
    padding: 0 0.3rem;
    line-height: 1.35;
  }
  .hw-level-default {
    border-color: var(--lm-orange);
    background: var(--lm-orange);
    color: #111;
  }
  .hw-open {
    display: inline-block;
    border-radius: 999px;
    background: var(--lm-orange);
    color: #111;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .hw-open:hover {
    filter: brightness(1.08);
  }
  .hw-open:focus-visible {
    outline: 2px solid var(--lm-screen-ink);
    outline-offset: 2px;
  }

  :global(.hw-search) {
    height: 2.75rem !important;
    border-color: var(--lm-key-edge) !important;
    background: var(--lm-key) !important;
    text-transform: lowercase;
  }

  .hw-keypad {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
  @media (min-width: 480px) {
    .hw-keypad {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 768px) {
    .hw-keypad {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .hw-keypad {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  .hw-key {
    display: flex;
    min-height: 5rem;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.5rem;
    border-radius: 0.5rem;
    background: var(--lm-key);
    padding: 0.625rem 0.7rem;
    text-align: left;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px var(--lm-key-edge), 0 3px 0 var(--lm-key-edge);
    transition: transform 70ms ease, box-shadow 70ms ease;
  }
  .hw-key:hover {
    box-shadow: inset 0 0 0 1px var(--muted-foreground), 0 3px 0 var(--lm-key-edge);
  }
  .hw-key:active {
    transform: translateY(2px);
    box-shadow: inset 0 0 0 1px var(--lm-key-edge), 0 1px 0 var(--lm-key-edge);
  }
  .hw-key[aria-pressed='true'] {
    background: var(--lm-orange);
    color: #111;
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--lm-orange) 70%, black), 0 3px 0 color-mix(in oklab, var(--lm-orange) 60%, black);
  }
  .hw-key:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .hw-key-name {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
  }
  .hw-key-vendor {
    font-size: 0.6875rem;
    opacity: 0.65;
  }

  .hw-specs th,
  .hw-specs td {
    padding: 0.625rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }
  .hw-specs thead th {
    border-bottom: 2px solid var(--foreground);
    color: var(--muted-foreground);
    font-weight: 500;
  }
  .hw-specs thead th.text-right,
  .hw-specs td.text-right {
    text-align: right;
  }
  .hw-specs tbody tr {
    border-bottom: 1px solid var(--border);
  }
  .hw-specs tbody th {
    font-weight: inherit;
  }
  .hw-row-selected {
    background: var(--accent);
  }
</style>
