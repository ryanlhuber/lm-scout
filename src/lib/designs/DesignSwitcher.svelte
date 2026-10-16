<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Palette from '@lucide/svelte/icons/palette';
  import * as Select from '$lib/components/ui/select';
  import { cn } from '$lib/utils';
  import { DESIGN_PARAM, designs, isDesignId } from './registry';

  let { class: className = '' }: { class?: string } = $props();

  const current = $derived(designs.find((design) => design.id === page.data.design) ?? designs[0]);

  const choose = (id: string) => {
    if (!isDesignId(id) || id === current.id) return;
    const url = new URL(page.url);
    url.searchParams.set(DESIGN_PARAM, id);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  };
</script>

<Select.Root type="single" value={current.id} onValueChange={choose}>
  <Select.Trigger size="sm" aria-label="Design iteration" class={cn('min-w-0 gap-2', className)}>
    <Palette class="size-4 opacity-70" />
    <span data-slot="select-value" class="truncate">{current.name}</span>
  </Select.Trigger>
  <Select.Content align="end" class="w-72">
    <Select.Group>
      <Select.GroupHeading>Design iteration</Select.GroupHeading>
      {#each designs as design (design.id)}
        <Select.Item value={design.id} label={design.name}>
          <span class="flex flex-col items-start gap-0.5">
            <span class="font-medium">{design.name}</span>
            <span class="text-xs whitespace-normal text-muted-foreground">{design.note}</span>
          </span>
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
