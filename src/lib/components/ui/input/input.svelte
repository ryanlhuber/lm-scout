<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { class: className, value = $bindable(), ...restProps }: HTMLInputAttributes = $props();
</script>

<input
  bind:value
  class={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50', className)}
  {...restProps}
/>
