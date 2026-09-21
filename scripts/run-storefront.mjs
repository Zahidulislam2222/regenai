import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storefrontDirectory = path.join(projectRoot, 'packages', 'storefront');
const [task, ...extraArgs] = process.argv.slice(2);

let child;

if (task === 'build' || task === 'dev') {
  const require = createRequire(import.meta.url);
  const shopifyPackage = require.resolve('@shopify/cli/package.json', {
    paths: [storefrontDirectory],
  });
  const shopifyCli = path.join(path.dirname(shopifyPackage), 'bin', 'run.js');
  const cliArgs = [
    shopifyCli,
    'hydrogen',
    task,
    '--codegen',
    '--path',
    storefrontDirectory,
    ...extraArgs.filter((argument) => argument !== '--'),
  ];

  child = spawn(process.execPath, cliArgs, {
    cwd: storefrontDirectory,
    env: {...process.env, INIT_CWD: storefrontDirectory},
    stdio: 'inherit',
  });
} else {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error('Run this command through npm so its installed npm CLI can be located.');
    process.exitCode = 2;
  } else {
    child = spawn(process.execPath, [npmCli, '--prefix', storefrontDirectory, 'run', ...(task ? [task] : []), ...extraArgs], {
      cwd: storefrontDirectory,
      env: {...process.env, INIT_CWD: storefrontDirectory},
      stdio: 'inherit',
    });
  }
}

if (child) {
  const forwardSignal = (signal) => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  };
  const handleInterrupt = () => forwardSignal('SIGINT');
  const handleTerminate = () => forwardSignal('SIGTERM');

  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleTerminate);
  child.on('error', (error) => {
    console.error(`Unable to start storefront command: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    process.off('SIGINT', handleInterrupt);
    process.off('SIGTERM', handleTerminate);
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}
