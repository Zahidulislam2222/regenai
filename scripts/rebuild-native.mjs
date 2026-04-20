// Postinstall hook — works around npm cli #4828.
//
// npm has a long-standing bug where `npm ci` on platform A fails to
// download platform-B variants of optional dependencies even when the
// lockfile lists them. Every package with platform-specific native
// bindings we actually use gets rebuilt here so CI on Linux (lockfile
// generated on Windows) still picks up the right `.node` binary.
//
// Safe to fail per-package — `try/catch` prevents install errors if a
// rebuild targets a dep that isn't installed in the current workspace.

import {execSync} from 'node:child_process';

const targets = [
  'lightningcss',
  '@tailwindcss/oxide',
  '@rollup/rollup',
  '@ast-grep/napi',
  '@unrs/resolver-binding',
];

for (const pkg of targets) {
  try {
    execSync(`npm rebuild ${pkg}`, {stdio: 'inherit'});
  } catch (err) {
    console.warn(
      `[postinstall] npm rebuild ${pkg} failed (ok if not installed): ${err.message}`,
    );
  }
}
