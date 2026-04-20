import {type RouteConfig, index, route} from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('admin/reviews', 'routes/admin.reviews.tsx'),
  route('auth/install', 'routes/auth.install.tsx'),
  route('auth/callback', 'routes/auth.callback.tsx'),
] satisfies RouteConfig;
