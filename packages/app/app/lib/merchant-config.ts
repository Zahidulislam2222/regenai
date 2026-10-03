/** One validated boundary for changeable merchant Worker settings. */

function boundedInteger(value: string | undefined, lower: number, upper: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < lower || parsed > upper) {
    throw new Error('Invalid merchant configuration');
  }
  return parsed;
}

export function authConfig(env: Env) {
  return {
    stateSeconds: boundedInteger(env.SHOPIFY_OAUTH_STATE_TTL_SECONDS, 60, 1200),
    sessionSeconds: boundedInteger(env.SHOPIFY_SESSION_TTL_SECONDS, 300, 86400),
  };
}

export function reviewQueueLimit(env: Env): number {
  return boundedInteger(env.REVIEW_QUEUE_LIMIT, 1, 100);
}

export function webhookMaxBodyBytes(env: Env): number {
  return boundedInteger(env.SHOPIFY_WEBHOOK_MAX_BODY_BYTES, 128, 1048576);
}
