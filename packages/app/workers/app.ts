/// <reference types="@cloudflare/workers-types" />

import {createRequestHandler} from 'react-router';

/**
 * Cloudflare Workers module entry for @regenai/app.
 *
 * Matches the canonical Cloudflare `react-router-starter-template`
 * entry shape: lazy import of the React Router server build via
 * `virtual:react-router/server-build`, typed AppLoadContext with
 * cloudflare.env and cloudflare.ctx.
 */

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  // eslint-disable-next-line import/no-unresolved -- virtual module resolved by @cloudflare/vite-plugin
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    try {
      return await requestHandler(request, {cloudflare: {env, ctx}});
    } catch (err) {
      console.error('[regenai-app] unhandled', err);
      return new Response('Internal server error', {status: 500});
    }
  },
} satisfies ExportedHandler<Env>;
