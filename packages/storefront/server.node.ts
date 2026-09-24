import {loadStorefrontSettings, readStorefrontEnvironment} from './app/lib/settings.server.ts';
import {startNodeRuntime} from './app/lib/node-server.ts';

const env = readStorefrontEnvironment(process.env);
const settings = loadStorefrontSettings(env);
const runtime = await startNodeRuntime(settings, env as Env);
let shuttingDown = false;

const stop = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  void runtime.shutdown().then(() => {
    // Shutdown has a shared finite deadline. Exit even if an upstream SDK call
    // ignores AbortSignal so deployment supervisors can restart this process.
    process.exit(0);
  });
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
