/**
 * /robots.txt route. Served at domain root.
 * Allows all search engines + points at sitemap.
 * /pages/styleguide is noindex via meta tag (see route).
 */

export const loader = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /checkouts/',
    'Disallow: /account',
    'Disallow: /account/',
    'Disallow: /pages/styleguide',
    '',
    'Sitemap: https://regenai.com/sitemap.xml',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
