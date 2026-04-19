/**
 * Recently-viewed products — localStorage-backed, bounded queue (max 12).
 * Usage on PDP: track(handle, title, imageSrc) on mount.
 */

const KEY = 'regenai:recently-viewed';
const MAX = 12;

export interface RecentlyViewedItem {
  handle: string;
  title: string;
  imageSrc: string;
  addedAt: number; // epoch ms
}

export function track(item: Omit<RecentlyViewedItem, 'addedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.handle !== item.handle);
    filtered.unshift({...item, addedAt: Date.now()});
    if (filtered.length > MAX) filtered.length = MAX;
    localStorage.setItem(KEY, JSON.stringify(filtered));
  } catch {
    // Ignore quota / disabled-storage errors.
  }
}

export function load(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : [];
  } catch {
    return [];
  }
}

export function clear() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
