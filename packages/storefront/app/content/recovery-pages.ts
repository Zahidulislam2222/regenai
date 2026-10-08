import rawPages from './recovery-pages.json';

export type InfoPage = {eyebrow: string; title: string; body: string; sections: [string, string][];
  action?: {label: string; href: string}};
type PageKey = keyof typeof rawPages;

export function validateInfoPages(input: unknown): Record<PageKey, InfoPage> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid page content');
  const pages = input as Record<string, unknown>;
  for (const key of Object.keys(rawPages) as PageKey[]) {
    const page = pages[key];
    if (!page || typeof page !== 'object' || Array.isArray(page)) throw new Error('Invalid page content');
    const value = page as Record<string, unknown>;
    if (typeof value.eyebrow !== 'string' || !value.eyebrow.trim() ||
        typeof value.title !== 'string' || !value.title.trim() ||
        typeof value.body !== 'string' || !value.body.trim() ||
        !Array.isArray(value.sections) || !value.sections.length ||
        !value.sections.every((section) => Array.isArray(section) && section.length === 2 &&
          section.every((part) => typeof part === 'string' && part.trim()))) {
      throw new Error('Invalid page content');
    }
    if (value.action !== undefined) {
      const action = value.action;
      if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Invalid page action');
      const link = action as Record<string, unknown>;
      if (typeof link.label !== 'string' || !link.label.trim() || typeof link.href !== 'string') {
        throw new Error('Invalid page action');
      }
      let url: URL;
      try { url = new URL(link.href); } catch { throw new Error('Invalid page action'); }
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
        throw new Error('Invalid page action');
      }
    }
  }
  return pages as Record<PageKey, InfoPage>;
}

export const pages = validateInfoPages(rawPages);
