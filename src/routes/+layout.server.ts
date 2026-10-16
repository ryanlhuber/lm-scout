import { DESIGN_PARAM } from '$lib/designs/registry';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
  // Reading the param makes this load re-run when the design switcher changes it.
  url.searchParams.get(DESIGN_PARAM);
  return { design: locals.design };
};
