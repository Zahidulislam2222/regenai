import type {ShouldRevalidateFunctionArgs} from 'react-router';

type CatalogRevalidationArgs = Pick<ShouldRevalidateFunctionArgs,
  'currentUrl' | 'nextUrl' | 'formMethod' | 'defaultShouldRevalidate'>;

export function shouldRevalidateCatalog({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: CatalogRevalidationArgs): boolean {
  if ((!formMethod || formMethod === 'GET') &&
      currentUrl.pathname === nextUrl.pathname &&
      currentUrl.search !== nextUrl.search) return false;
  return defaultShouldRevalidate;
}
