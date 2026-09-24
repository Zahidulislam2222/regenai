import {products} from '../../content/recovery';
import {recoverySettings} from '../../config/recovery';
export interface BagLine {
  id: string;
  option: string;
  quantity: number;
}
export function parseBag(raw: string | null): BagLine[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
      .filter((item): item is BagLine => {
        if (!item || typeof item !== 'object') return false;
        const line = item as BagLine;
        const p = products.find((product) => product.id === line.id);
        const key = JSON.stringify([line.id, line.option]);
        if (
          !p ||
          !p.options.includes(line.option) ||
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > recoverySettings.maxQuantity ||
          seen.has(key)
        )
          return false;
        seen.add(key);
        return true;
      })
      .slice(0, recoverySettings.maxCartLines)
      .map(({id, option, quantity}) => ({id, option, quantity}));
  } catch {
    return [];
  }
}
export function updateBag(
  bag: BagLine[],
  id: string,
  option: string,
  quantity: number,
): BagLine[] {
  const p = products.find((product) => product.id === id);
  if (!p || !p.options.includes(option) || !Number.isFinite(quantity))
    return bag;
  const next = bag.filter((line) => line.id !== id || line.option !== option);
  const q = Math.min(
    recoverySettings.maxQuantity,
    Math.max(0, Math.floor(quantity)),
  );
  if (q && next.length < recoverySettings.maxCartLines) {
    const originalIndex = bag.findIndex(
      (line) => line.id === id && line.option === option,
    );
    next.splice(originalIndex < 0 ? next.length : originalIndex, 0, {
      id,
      option,
      quantity: q,
    });
  }
  return next;
}
export const bagSubtotal = (bag: BagLine[]) =>
  bag.reduce(
    (sum, line) =>
      sum +
      (products.find((p) => p.id === line.id)?.price ?? 0) * line.quantity,
    0,
  );
export function findProducts({
  query,
  category,
  sort,
}: {
  query: string;
  category: string;
  sort: string;
}) {
  const result = products.filter(
    (p) =>
      (category === 'All tools' || p.category === category) &&
      `${p.name} ${p.kind} ${p.description} ${p.areas.join(' ')}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  return result;
}
export function recommend(area: string, category: string) {
  const exact = products.filter(
    (p) => p.areas.includes(area) && p.category === category,
  );
  return exact.length
    ? exact
    : products.filter((p) => p.areas.includes(area)).slice(0, 3);
}
