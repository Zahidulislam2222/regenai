import {type RouteConfig, index, route} from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('admin/reviews', 'routes/admin.reviews.tsx'),
  route('admin/reviews/:id', 'routes/admin.review-detail.tsx'),
  route('admin/privacy', 'routes/admin.privacy.tsx'),
  route('admin/privacy/:id/export', 'routes/admin.privacy-export.ts'),
  route('auth/install', 'routes/auth.install.tsx'),
  route('auth/callback', 'routes/auth.callback.tsx'),
  route('webhooks/app-uninstalled', 'routes/webhooks.app-uninstalled.ts'),
  route('webhooks/privacy', 'routes/webhooks.privacy.ts'),
] satisfies RouteConfig;
