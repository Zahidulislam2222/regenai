export function previewSettings(env: Record<string, string | undefined>) {
  const port = Number(env.FRONTEND_PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Invalid FRONTEND_PORT');
  return {host: env.FRONTEND_HOST ?? '127.0.0.1', port};
}
