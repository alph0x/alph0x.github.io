#!/usr/bin/env node
/**
 * @fileoverview Pre-flight conflict scan and readiness check.
 * Verifies tests pass, working tree state, and overlapping active missions.
 * Zero dependencies. Run with: node scripts/preflight-check.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let exitCode = 0;

function log(msg, color = RESET) {
  console.log(color + msg + RESET);
}

function heading(title) {
  console.log('\n' + '='.repeat(50));
  console.log(title);
  console.log('='.repeat(50));
}

// ── 1. Git status ───────────────────────────────────────────────

heading('GIT STATUS');

try {
  const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
  if (status.trim()) {
    log('⚠️  Uncommitted changes detected:', YELLOW);
    console.log(status);
    log('→ Commit, stash, or document these in your sailing orders.', YELLOW);
  } else {
    log('✅ Working tree is clean.', GREEN);
  }
} catch (e) {
  log('❌ Could not run git status. Are you in a git repo?', RED);
  exitCode = 1;
}

// ── 2. Active mission overlap ───────────────────────────────────

heading('ACTIVE MISSIONS');

const missionsDir = path.join(process.cwd(), '.missions', 'active');
if (fs.existsSync(missionsDir)) {
  const files = fs.readdirSync(missionsDir);
  if (files.length > 0) {
    log(`⚠️  Found ${files.length} active mission file(s):`, YELLOW);
    files.forEach((f) => console.log('  - ' + f));
    log('→ Review for overlapping file ownership before proceeding.', YELLOW);
  } else {
    log('✅ No active missions recorded.', GREEN);
  }
} else {
  log('ℹ️  No .missions/active/ directory. Creating one...', RESET);
  fs.mkdirSync(missionsDir, { recursive: true });
}

// ── 3. Test suite ───────────────────────────────────────────────

heading('TEST SUITE');

const skipTests = process.argv.includes('--no-tests');
if (skipTests) {
  log('⏭️  Tests skipped via --no-tests', YELLOW);
} else {
  try {
    execSync('npm test -- --run', {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120_000,
    });
    log('✅ All tests pass.', GREEN);
  } catch (e) {
    log('❌ Tests FAILED. Fix before proceeding.', RED);
    if (e.stdout) console.log(e.stdout);
    if (e.stderr) console.log(e.stderr);
    exitCode = 1;
  }
}

// ── 4. Summary ──────────────────────────────────────────────────

heading('PREFLIGHT SUMMARY');

if (exitCode === 0) {
  log('🟢 CLEARED FOR TAKEOFF', GREEN);
} else {
  log('🔴 HOLD — Address issues above before starting mission.', RED);
}

process.exit(exitCode);
