import type {ShopifyCatalogProduct} from './shopify-catalog.server';

type CartLimits = {maxLineQuantity: number; maxTotalQuantity: number; maxLines: number};

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function existingLines(cart: unknown): {id: string; merchandiseId: string; quantity: number}[] {
  if (cart === null || cart === undefined) return [];
  const source = object(cart);
  const nodes = object(source?.lines)?.nodes;
  if (!Array.isArray(nodes)) throw new Error('Invalid sandbox cart');
  return nodes.map((value) => {
    const line = object(value);
    const id = line?.id;
    const merchandiseId = object(line?.merchandise)?.id;
    const quantity = line?.quantity;
    if (typeof id !== 'string' || typeof merchandiseId !== 'string' ||
        !Number.isSafeInteger(quantity) || Number(quantity) < 1) {
      throw new Error('Invalid sandbox cart');
    }
    return {id, merchandiseId, quantity: Number(quantity)};
  });
}

function ownedVariants(products: ShopifyCatalogProduct[], availableOnly: boolean): Set<string> {
  return new Set(products.filter((product) => !availableOnly || product.complete)
    .flatMap((product) => product.variants.filter((variant) => !availableOnly || variant.availableForSale)
      .map((variant) => variant.id)));
}

export function validateSandboxAdd(
  lines: unknown,
  currentCart: unknown,
  products: ShopifyCatalogProduct[],
  limits: CartLimits,
): {merchandiseId: string; quantity: number}[] {
  if (!Array.isArray(lines) || lines.length !== 1) throw new Error('Invalid sandbox cart line');
  const line = object(lines[0]);
  if (!line || Object.keys(line).some((key) => !['merchandiseId', 'quantity'].includes(key))) {
    throw new Error('Invalid sandbox cart line');
  }
  const merchandiseId = line.merchandiseId;
  const quantity = line.quantity;
  if (typeof merchandiseId !== 'string' || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(merchandiseId) ||
      !Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > limits.maxLineQuantity) {
    throw new Error('Invalid sandbox cart line');
  }
  const available = ownedVariants(products, true);
  if (!available.has(merchandiseId)) throw new Error('Variant is unavailable in this sandbox');
  const owned = ownedVariants(products, false);
  const current = existingLines(currentCart);
  if (current.some((item) => !owned.has(item.merchandiseId))) {
    throw new Error('Cart contains a non-sandbox line');
  }
  const same = current.find((item) => item.merchandiseId === merchandiseId);
  if (same && same.quantity + Number(quantity) > limits.maxLineQuantity) {
    throw new Error('Sandbox line quantity limit exceeded');
  }
  if (!same && current.length >= limits.maxLines) throw new Error('Sandbox line limit exceeded');
  if (current.reduce((total, item) => total + item.quantity, 0) + Number(quantity) > limits.maxTotalQuantity) {
    throw new Error('Sandbox quantity limit exceeded');
  }
  return [{merchandiseId, quantity: Number(quantity)}];
}

export function validateSandboxRemove(lineIds: unknown, currentCart: unknown): string[] {
  if (!Array.isArray(lineIds) || lineIds.length !== 1 || typeof lineIds[0] !== 'string') {
    throw new Error('Invalid sandbox line removal');
  }
  if (!existingLines(currentCart).some((item) => item.id === lineIds[0])) {
    throw new Error('Unknown sandbox line');
  }
  return [lineIds[0]];
}

export function validateSandboxUpdate(
  lines: unknown,
  currentCart: unknown,
  products: ShopifyCatalogProduct[],
  limits: CartLimits,
): {id: string; quantity: number}[] {
  if (!Array.isArray(lines) || lines.length !== 1) throw new Error('Invalid sandbox line update');
  const input = object(lines[0]);
  if (!input || Object.keys(input).some((key) => !['id', 'quantity'].includes(key)) ||
      typeof input.id !== 'string' || !Number.isSafeInteger(input.quantity) ||
      Number(input.quantity) < 1 || Number(input.quantity) > limits.maxLineQuantity) {
    throw new Error('Invalid sandbox line update');
  }
  const current = existingLines(currentCart);
  const owned = ownedVariants(products, false);
  if (current.some((line) => !owned.has(line.merchandiseId))) {
    throw new Error('Cart contains a non-sandbox line');
  }
  const target = current.find((line) => line.id === input.id);
  if (!target) throw new Error('Unknown sandbox line');
  const quantity = Number(input.quantity);
  if (quantity > target.quantity && !ownedVariants(products, true).has(target.merchandiseId)) {
    throw new Error('Variant is unavailable in this sandbox');
  }
  const total = current.reduce((sum, line) => sum + line.quantity, 0) - target.quantity + quantity;
  if (total > limits.maxTotalQuantity) throw new Error('Sandbox quantity limit exceeded');
  return [{id: target.id, quantity}];
}

export function sandboxCartIsOwned(cart: unknown, products: ShopifyCatalogProduct[]): boolean {
  try {
    const owned = ownedVariants(products, false);
    return existingLines(cart).every((line) => owned.has(line.merchandiseId));
  } catch {
    return false;
  }
}

export function validatedSandboxCheckoutUrl(value: unknown, domain: string): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== domain || url.port ||
        url.username || url.password || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}
