#!/usr/bin/env node
// Align every JS package under packages/js/* to a target version.
//
// WHY THIS EXISTS
// ---------------
// `monorepo-builder release X.Y.Z` (run by .github/workflows/release.yml) only
// touches PHP packages — it is configured with packageDirectories(['packages/php']).
// The JS package.json files are NOT bumped, so when the resulting tag triggers
// publish-npm.yml, its version-match check used to fail and npm was left behind.
// release.yml now calls this script before tagging so the JS packages — and thus
// the npm registry — stay in sync with every release.
//
// It is idempotent and sets versions absolutely (not by increment), so running it
// from a stale base still produces the exact target version.
//
// Usage:
//   node scripts/bump-js-version.mjs 0.7.0
//   node scripts/bump-js-version.mjs v0.7.0   # leading v is stripped
//
// Edits are done as targeted text replacements to preserve existing formatting
// and key order (minimal diffs).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const JS_DIR = 'packages/js';

const raw = process.argv[2];
if (!raw) {
  console.error('usage: bump-js-version.mjs <version|vX.Y.Z>');
  process.exit(1);
}

const version = raw.replace(/^v/, '');
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`error: "${raw}" is not a valid semver version`);
  process.exit(1);
}
const range = `^${version}`;

let changed = 0;
for (const entry of readdirSync(JS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = join(JS_DIR, entry.name, 'package.json');

  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // directory without a package.json — skip
  }
  const before = text;

  // 1) The package's own version (top-level key, 2-space indented).
  text = text.replace(/^(\s{2}"version":\s*")[^"]*(")/m, `$1${version}$2`);

  // 2) Internal @ceedcv-maya/* dependency ranges, across every dependency block.
  //    Skip workspace: protocol entries (left for pnpm to resolve).
  text = text.replace(
    /("@ceedcv-maya\/[^"]+":\s*")([^"]*)(")/g,
    (match, pre, value, post) =>
      value.startsWith('workspace:') ? match : `${pre}${range}${post}`,
  );

  if (text !== before) {
    writeFileSync(file, text);
    console.log(`aligned ${entry.name} -> ${version}`);
    changed++;
  }
}

console.log(`${changed} JS package(s) aligned to ${version}`);
