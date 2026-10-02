import type {Route} from './+types/sitemap[.]xml';
import {editorial} from '~/content/recovery-editorial';

const staticPaths = [
  '/',
  '/collections/all',
  '/about',
  '/evidence',
  '/journal',
];

export function loader({context}: Route.LoaderArgs) {
  const origin = context.settings.canonicalOrigin;
  const paths = [
    ...staticPaths,
    ...editorial.stories.map(({slug}) => `/journal/${slug}`),
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, origin).toString().replaceAll('&', '&amp;')}</loc></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    {headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600'}},
  );
}
