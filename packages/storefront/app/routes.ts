import {flatRoutes} from '@react-router/fs-routes';
import {index, layout, route, type RouteConfig} from '@react-router/dev/routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

const recoveryRoutes = layout('routes/recovery/layout.tsx', [
  index('routes/recovery/home.tsx'),
  route('collections/all', 'routes/recovery/collection.tsx'),
  route('search', 'routes/recovery/search.tsx'),
  route('products/:handle', 'routes/recovery/product.tsx'),
  route('quiz', 'routes/recovery/finder.tsx'),
  route('about', 'routes/recovery/about.tsx'),
  route('evidence', 'routes/recovery/evidence.tsx'),
  route('policies/:policy', 'routes/recovery/policy.tsx'),
  route('cart', 'routes/cart.tsx'),
  route('*', 'routes/recovery/not-found.tsx'),
]);

const supersededStorefrontPages = [
  'routes/_index.tsx',
  'routes/cart.tsx',
  'routes/collections.$handle.tsx',
  'routes/products.$handle.tsx',
  'routes/search.tsx',
  'routes/quiz.tsx',
  'routes/recovery/**',
];

export const routeEntries = [
  recoveryRoutes,
  ...(await flatRoutes({ignoredRouteFiles: supersededStorefrontPages})),
];

export default hydrogenRoutes(routeEntries) satisfies RouteConfig;
