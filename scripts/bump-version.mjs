#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

function bumpSemver(version, part) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  if (part === "patch") return `${major}.${minor}.${patch + 1}`;
  return null;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/bump-version.mjs <version|patch|minor|major>");
  process.exit(1);
}

const pkgPath    = resolve(root, "package.json");
const tauriPath  = resolve(root, "src-tauri/tauri.conf.json");
const cargoPath  = resolve(root, "src-tauri/Cargo.toml");

const pkg   = readJson(pkgPath);
const tauri = readJson(tauriPath);
const current = pkg.version;

const next = ["patch", "minor", "major"].includes(arg)
  ? bumpSemver(current, arg)
  : /^\d+\.\d+\.\d+$/.test(arg) ? arg : null;

if (!next) {
  console.error(`Invalid argument: ${arg}`);
  process.exit(1);
}

// package.json
pkg.version = next;
writeJson(pkgPath, pkg);

// tauri.conf.json
tauri.version = next;
writeJson(tauriPath, tauri);

// Cargo.toml — replace first `version = "x.y.z"` line
const cargo = readFileSync(cargoPath, "utf8");
const updated = cargo.replace(/^version = "[\d.]+"/m, `version = "${next}"`);
writeFileSync(cargoPath, updated);

console.log(`${current} → ${next}`);

const run = cmd => execSync(cmd, { cwd: root, stdio: "inherit" });
run(`git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`);
run(`git commit -m "v${next}"`);
run(`git tag v${next}`);
console.log(`\nTo release:\n  git push && git push origin v${next}`);
