<script lang="ts">
  import type { SimpleIcon } from 'simple-icons';
  import {
    siAlibabacloud,
    siAnthropic,
    siBaidu,
    siBytedance,
    siCursor,
    siDeepmind,
    siDeepseek,
    siMeta,
    siMinimax,
    siMistralai,
    siMoonshotai,
    siNvidia,
    siOpenrouter,
    siPerplexity,
    siQwen,
    siX,
    siXiaomi
  } from 'simple-icons';

  let { vendor, modelId = '', size = 'md' }: { vendor: string; modelId?: string; size?: 'sm' | 'md' } = $props();

  const logos: Record<string, SimpleIcon> = {
    'Anthropic': siAnthropic,
    'Meta': siMeta,
    'xAI': siX,
    'DeepSeek': siDeepseek,
    'Moonshot AI': siMoonshotai,
    'Xiaomi': siXiaomi,
    'Alibaba': siAlibabacloud,
    'MiniMax': siMinimax,
    'Mistral': siMistralai,
    'Cursor': siCursor,
    'Google / DeepMind': siDeepmind,
    'NVIDIA': siNvidia,
    'ByteDance': siBytedance,
    'OpenRouter': siOpenrouter,
    'Baidu': siBaidu,
    'Perplexity': siPerplexity,
    'Qwen': siQwen
  };

  const brand = $derived(modelId.replace(/^~/, '').startsWith('qwen/') ? 'Qwen' : vendor);
  const logo = $derived(logos[brand]);
  const initials = $derived(brand
    .split(/[\s/.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase());
  const dimensions = $derived(size === 'sm' ? 'size-7 rounded-md' : 'size-9 rounded-lg');
</script>

<span
  class={`inline-flex ${dimensions} shrink-0 items-center justify-center border bg-background text-[10px] font-semibold tracking-tight`}
  title={brand}
  aria-label={`${brand} logo`}
  data-logo-source={logo ? 'simple-icons' : 'monogram'}
>
  {#if logo}
    <svg
      class={size === 'sm' ? 'size-4' : 'size-5'}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
    >
      <path fill="currentColor" d={logo.path}></path>
    </svg>
  {:else}
    <span aria-hidden="true">{initials || '?'}</span>
  {/if}
</span>
