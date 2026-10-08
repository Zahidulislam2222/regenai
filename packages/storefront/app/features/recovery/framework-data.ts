import {products, site} from '../../content/recovery';

export function getDemoRecoveryProduct(handle: string | undefined) {
  if (!handle) return undefined;
  return products.find((product) => product.id === handle);
}

function isInfoPage(value: string): value is keyof typeof site.pages {
  return Object.hasOwn(site.pages, value);
}

export function getDemoPolicyPage(policy: string | undefined) {
  if (!policy || !isInfoPage(policy)) {
    return undefined;
  }
  const hasPolicyRoute = site.footer.links.some(
    (item) => item.to === `/policies/${policy}`,
  );
  return hasPolicyRoute ? policy : undefined;
}
