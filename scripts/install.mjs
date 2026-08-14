// scripts/install.mjs — install (copy) this plugin into a dsh profile's
// node_modules so the Loader can resolve the bare package name through
// Node's ordinary parent-walk (the same tree pnpm's hoisted linker writes).
//
//   node scripts/install.mjs <profile-dir>   e.g. C:\Users\you\.dsh2\profiles\web
//
// A real directory copy (not a junction) keeps Node ESM peer resolution
// anchored inside the profile tree regardless of symlink-realpath policy.
// Re-run after editing sources to sync; enable the row in the profile's
// cordis.patch.yml (see README.md). Removes the pre-rename package
// `dsh-plugin-turn-status` when present.
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..");
const profileDir = process.argv[2];
if (profileDir === void 0) {
  console.error("usage: node scripts/install.mjs <profile-dir>");
  process.exit(2);
}

const legacy = join(profileDir, "node_modules", "dsh-plugin-turn-status");
if (existsSync(legacy)) {
  await rm(legacy, { recursive: true, force: true });
  console.log(`removed legacy package ${legacy}`);
}

const target = join(profileDir, "node_modules", "dsh-plugin-working-status");
await mkdir(dirname(target), { recursive: true });
if (existsSync(target)) await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const rel of ["package.json", "lib", "README.md", "README.en.md"]) {
  await cp(join(source, rel), join(target, rel), { recursive: true, force: true });
}
console.log(`installed dsh-plugin-working-status -> ${target}`);
