import type { DesignId } from '$lib/designs/registry';

declare global {
  namespace App {
    interface Locals {
      design: DesignId;
    }
  }
}

export {};
