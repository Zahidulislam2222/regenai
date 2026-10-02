const safeErrorCodes = {
  requestFailed: 'storefront.request_failed',
  renderFailed: 'storefront.render_failed',
  footerQueryFailed: 'storefront.footer_query_failed',
} as const;

export type SafeErrorEvent = keyof typeof safeErrorCodes;

/** Log only fixed, allowlisted event codes. Never pass Error, URL, or headers. */
export function logSafeError(event: SafeErrorEvent): void {
  const code = safeErrorCodes[event];
  console.error(`[regenai] ${code ?? 'storefront.request_failed'}`);
}
