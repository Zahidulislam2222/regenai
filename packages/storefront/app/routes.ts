import {flatRoutes} from '@react-router/fs-routes';
import {index, layout, route, type RouteConfig} from '@react-router/dev/routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

const recoveryRoutes = layout('routes/recovery/layout.tsx', [
  index('routes/recovery/home.tsx'),
  route('collections', 'routes/recovery/collections-index.tsx'),
  route('collections/all', 'routes/recovery/collection.tsx'),
  route('collections/:categoryHandle', 'routes/recovery/category.tsx'),
  route('search', 'routes/recovery/search.tsx'),
  route('products/:handle', 'routes/recovery/product.tsx'),
  route('quiz', 'routes/recovery/finder.tsx'),
  route('about', 'routes/recovery/about.tsx'),
  route('evidence', 'routes/recovery/evidence.tsx'),
  route('help', 'routes/recovery/help.tsx'),
  route('contact', 'routes/recovery/contact.tsx'),
  route('journal', 'routes/recovery/journal.tsx'),
  route('journal/:slug', 'routes/recovery/journal-article.tsx'),
  route('policies/:policy', 'routes/recovery/policy.tsx'),
  route('cart', 'routes/cart.tsx'),
  route('account', 'routes/account/index.tsx'),
  route('account/login', 'routes/account/login.tsx'),
  route('account/authorize', 'routes/account/authorize.tsx'),
  route('account/logout', 'routes/account/logout.tsx'),
  route('*', 'routes/recovery/not-found.tsx'),
]);

const supersededStorefrontPages = [
  'routes/cart.tsx',
  'routes/recovery/**',
];

export const routeEntries = [
  recoveryRoutes,
  ...(await flatRoutes({ignoredRouteFiles: supersededStorefrontPages})),
];

export default hydrogenRoutes(routeEntries) satisfies RouteConfig;
