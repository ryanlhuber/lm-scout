<script lang="ts">
  import type { SimpleIcon } from 'simple-icons';
  import {
    siAlibabacloud,
    siAnthropic,
    siBaidu,
    siBytedance,
    siCursor,
    siDeepseek,
    siGooglegemini,
    siMeta,
    siMinimax,
    siMistralai,
    siMoonshotai,
    siNvidia,
    siOpenrouter,
    siPerplexity,
    siQwen,
    siX,
    siXiaomi,
    siZdotai
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
    'Google': siGooglegemini,
    'NVIDIA': siNvidia,
    'ByteDance': siBytedance,
    'OpenRouter': siOpenrouter,
    'Baidu': siBaidu,
    'Perplexity': siPerplexity,
    'Qwen': siQwen,
    'Z.ai': siZdotai
  };

  const officialVectorLogos: Record<string, string> = {
    'OpenAI': 'https://images.ctfassets.net/kftzwdyauwt9/3hUGLn3ypllZ0oa01qOYVq/28e8188e6f11b84c3e876569d492734f/Blossom_Light.svg?q=90&w=3840',
    'Microsoft': 'https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg',
    'Tencent': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Tencent_logo_2017.svg'
  };

  const brand = $derived(modelId.replace(/^~/, '').startsWith('qwen/') ? 'Qwen' : vendor);
  const logo = $derived(logos[brand]);
  const officialVectorLogo = $derived(officialVectorLogos[brand]);
  const isWideOfficialLogo = $derived(brand === 'Tencent');
  const initials = $derived(brand
    .split(/[\s/.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase());
  const dimensions = $derived(isWideOfficialLogo
    ? (size === 'sm' ? 'h-7 w-12 rounded-md' : 'h-9 w-16 rounded-lg')
    : (size === 'sm' ? 'size-7 rounded-md' : 'size-9 rounded-lg'));
</script>

<span
  class={`inline-flex ${dimensions} shrink-0 items-center justify-center border bg-background text-[10px] font-semibold tracking-tight`}
  title={brand}
  aria-label={`${brand} logo`}
  data-logo-source={logo ? 'simple-icons' : officialVectorLogo ? 'official-vector' : 'monogram'}
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
  {:else if officialVectorLogo}
    <img
      class={`${isWideOfficialLogo ? (size === 'sm' ? 'h-auto w-9' : 'h-auto w-12') : (size === 'sm' ? 'size-4' : 'size-5')} ${brand === 'OpenAI' ? 'dark:invert' : ''}`}
      src={officialVectorLogo}
      alt=""
      aria-hidden="true"
    />
  {:else}
    <span aria-hidden="true">{initials || '?'}</span>
  {/if}
</span>
