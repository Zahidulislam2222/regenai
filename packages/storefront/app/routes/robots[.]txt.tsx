/**
 * /robots.txt route. Served at domain root.
 * Lets crawlers fetch noindex pages and points at the sitemap.
 * Private account and checkout paths remain disallowed.
 */

import type {Route} from './+types/robots[.]txt';

export const loader = ({context}: Route.LoaderArgs) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /checkouts/',
    'Disallow: /account',
    'Disallow: /account/',
    '',
    `Sitemap: ${new URL('/sitemap.xml', context.settings.canonicalOrigin).toString()}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
