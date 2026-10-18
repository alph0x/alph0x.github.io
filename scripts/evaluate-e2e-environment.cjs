'use strict';

// Capture the ordinary E2E workload without modifying its tests or acceptance limits.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { performance } = require('node:perf_hooks');

const BASE = '04b267f5cdfce9c8f7e9319f71c5a316e9499ad1';
const BRANCH = 'codex/macos15-evaluation';
const REPOSITORY = 'alph0x/alph0x.github.io';
const WRITES = ['.github/workflows/macos-environment-evaluation.yml', 'scripts/evaluate-e2e-environment.cjs', 'vercel.json'];
const LOG_CAP = 32 * 1024 ** 2;
const EVIDENCE_CAP = 512 * 1024 ** 2;
const EXPECTED = [
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural en query 'what do you do?' to the right answer"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query '¿en qué trabajas?' to the right answer"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query 'hablas español?' to the right answer"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural en query 'what skills does he have?' to the right answer"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query '¿cómo lo contacto?' to the right answer"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "each of the 4 suggestion chips answers in the query language"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "chips and typed input share the same send path"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "terminal mode still routes commands"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/editor.spec.cjs",
    "titlePath": [
      "Editor E2E",
      "loads, zooms, and toggles 3D/top view"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "prompt shows [E] name for every actionable interactable"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "macBook carries panel-alphgpt through the data flow"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "E on macBook opens panel-alphgpt in terminal mode"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "Terminal command response",
      "AlphGPT terminal answers a command"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "E on unmapped furniture opens no panel"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "panel closes via close button, Escape, and outside click"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "after ENTER, opening a panel does not resurrect the start screen"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/portfolio.spec.cjs",
    "titlePath": [
      "Portfolio Desktop",
      "start screen loads and portfolio renders"
    ],
    "status": "passed"
  },
  {
    "project": "chromium",
    "file": "tests/e2e/portfolio.spec.cjs",
    "titlePath": [
      "Portfolio Mobile",
      "touch controls are visible on mobile landscape"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural en query 'what do you do?' to the right answer"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query '¿en qué trabajas?' to the right answer"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query 'hablas español?' to the right answer"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural en query 'what skills does he have?' to the right answer"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "routes natural es query '¿cómo lo contacto?' to the right answer"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "each of the 4 suggestion chips answers in the query language"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "chips and typed input share the same send path"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/alphgpt-chat.spec.cjs",
    "titlePath": [
      "AlphGPT NLU UI gate (G-03)",
      "terminal mode still routes commands"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/editor.spec.cjs",
    "titlePath": [
      "Editor E2E",
      "loads, zooms, and toggles 3D/top view"
    ],
    "status": "passed"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "prompt shows [E] name for every actionable interactable"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "macBook carries panel-alphgpt through the data flow"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "E on macBook opens panel-alphgpt in terminal mode"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "Terminal command response",
      "AlphGPT terminal answers a command"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "E on unmapped furniture opens no panel"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "panel closes via close button, Escape, and outside click"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/interactions.spec.cjs",
    "titlePath": [
      "Interaction validation suite",
      "after ENTER, opening a panel does not resurrect the start screen"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/portfolio.spec.cjs",
    "titlePath": [
      "Portfolio Desktop",
      "start screen loads and portfolio renders"
    ],
    "status": "skipped"
  },
  {
    "project": "Mobile Chrome",
    "file": "tests/e2e/portfolio.spec.cjs",
    "titlePath": [
      "Portfolio Mobile",
      "touch controls are visible on mobile landscape"
    ],
    "status": "passed"
  }
];
const PHASES = ['Real game boot', 'Open terminal through E and zoom', 'Send help', 'Fresh bot command response with active render'];
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'environment-results');
const rawRoots = [output, path.join(root, 'test-results')];
const stamp = () => new Date().toISOString();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
const isChurn = error => ['ENOENT', 'ENOTDIR'].includes(error.code);
function files(directory, tolerateChurn = false) {
  let entries;
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT' || (tolerateChurn && isChurn(error))) return []; throw error; }
  return entries.flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected evidence symlink: ' + file);
    return entry.isDirectory() ? files(file, tolerateChurn) : entry.isFile() ? [file] : [];
  }).sort();
}
function byteSize(roots, tolerateChurn = false) {
  let total = 0;
  for (const file of roots.flatMap(directory => files(directory, tolerateChurn))) {
    try { const stat = fs.lstatSync(file); if (stat.isSymbolicLink()) throw new Error('Unexpected evidence symlink: ' + file); if (stat.isFile()) total += stat.size; }
    catch (error) { if (!tolerateChurn || !isChurn(error)) throw error; }
  }
  return total;
}
function writeAll(fd, bytes, writer = fs.writeSync) {
  let offset = 0;
  while (offset < bytes.length) {
    const written = writer(fd, bytes, offset, bytes.length - offset);
    if (!Number.isInteger(written) || written <= 0) throw new Error('Native stream write made no progress');
    offset += written;
  }
}
function digestFile(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const chunk = Buffer.alloc(1024 * 1024);
  try { let size; while ((size = fs.readSync(fd, chunk))) hash.update(chunk.subarray(0, size)); }
  finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
function appendOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
function native(command, args, receipts, timeout = 5000) {
  const startedAt = stamp();
  const r = cp.spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout, maxBuffer: 4 * 1024 ** 2 });
  receipts.push({ command: [command, ...args], cwd: root, startedAt, finishedAt: stamp(), exit: r.status, signal: r.signal, error: r.error?.message ?? null, stdout: r.stdout ?? '', stderr: r.stderr ?? '' });
  if (r.status !== 0 || r.error || r.signal) throw new Error('Native identity command failed: ' + command);
  return r.stdout.trim();
}

function contextErrors(c, full) {
  const errors = [];
  const require = (valid, reason) => { if (!valid) errors.push(reason); };
  require(c.repository === REPOSITORY && c.eventName === 'push', 'repository/event');
  require(c.ref === 'refs/heads/' + BRANCH && String(c.attempt) === '1', 'ref/run attempt');
  require(/^[a-f0-9]{40}$/.test(c.sha || '') && c.head === c.sha, 'checkout SHA');
  require(isDeepStrictEqual(c.parents, [BASE]), 'single direct parent');
  require(isDeepStrictEqual([...(c.changed || [])].sort(), [...WRITES].sort()), 'exact three-file diff');
  require(c.clean === true && c.vercelOnlyRule === true, 'protected source/Vercel rule');
  const e = c.event || {};
  require(e.before === '0'.repeat(40) && e.created === true && e.deleted === false, 'new non-deletion branch push');
  require(e.after === c.sha && e.head_commit?.id === c.sha && e.ref === c.ref && e.repository?.full_name === REPOSITORY, 'event identities');
  require(c.platform === 'darwin' && c.arch === 'arm64' && /^15\./.test(c.osVersion || ''), 'macOS15 ARM64');
  require(typeof c.image === 'string' && c.image.length > 0, 'image version missing');
  require(!c.firstImage || c.image === c.firstImage, 'image mismatch');
  if (c.diskAdmission !== false) require(c.freeBytes >= 4 * 1024 ** 3, 'disk floor');
  if (full) {
    require(c.node === '24.21.0', 'Node version');
    require(c.playwright === '1.61.1', 'Playwright version');
    require(c.browser === '149.0.7827.55', 'bundled Chromium version');
  }
  return errors;
}
function collectContext(full) {
  const receipts = [];
  const c = { observedAt: stamp(), diskAdmission: !full, platform: process.platform, arch: process.arch, node: process.versions.node, repository: process.env.GITHUB_REPOSITORY, eventName: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF, sha: process.env.GITHUB_SHA, attempt: process.env.GITHUB_RUN_ATTEMPT, runId: process.env.GITHUB_RUN_ID, job: process.env.GITHUB_JOB, image: process.env.ImageVersion, imageOS: process.env.ImageOS, firstImage: process.env.FIRST_IMAGE || '', nativeCommands: receipts };
  try {
    const rawEvent = fs.readFileSync(process.env.GITHUB_EVENT_PATH);
    const event = JSON.parse(rawEvent);
    c.eventPayloadSha256 = sha(rawEvent);
    c.event = { before: event.before, after: event.after, created: event.created, deleted: event.deleted, ref: event.ref, repository: { full_name: event.repository?.full_name }, head_commit: { id: event.head_commit?.id } };
    c.eventProjection = 'Technical identity fields only; account/pusher/contact data excluded';
    c.head = native('git', ['rev-parse', 'HEAD'], receipts);
    c.parents = native('git', ['show', '-s', '--format=%P', 'HEAD'], receipts).split(/\s+/).filter(Boolean);
    c.changed = native('git', ['diff', '--name-only', BASE, 'HEAD', '--'], receipts).split('\n').filter(Boolean);
    c.clean = native('git', ['diff', '--name-only', 'HEAD', '--'], receipts) === '';
    const previous = JSON.parse(native('git', ['show', BASE + ':vercel.json'], receipts));
    const expected = structuredClone(previous);
    expected.git = { ...expected.git, deploymentEnabled: { ...expected.git?.deploymentEnabled, [BRANCH]: false } };
    c.vercelOnlyRule = isDeepStrictEqual(expected, read(path.join(root, 'vercel.json')));
    c.osVersion = native('sw_vers', ['-productVersion'], receipts);
    c.hardware = native('sysctl', ['hw.ncpu', 'hw.memsize', 'hw.model'], receipts);
    const stat = fs.statfsSync(root); c.freeBytes = stat.bavail * stat.bsize;
    if (full) {
      c.playwright = require(path.join(root, 'node_modules/playwright/package.json')).version;
      c.browserExecutable = require(path.join(root, 'node_modules/playwright')).chromium.executablePath();
      const version = native(c.browserExecutable, ['--version'], receipts);
      c.browser = version.match(/\b(\d+\.\d+\.\d+\.\d+)\b/)?.[1];
    }
    c.errors = contextErrors(c, full);
    if (c.job === 'measure_2' && !c.firstImage) c.errors.push('job2 first image missing');
    if (!['measure_1', 'measure_2'].includes(c.job)) c.errors.push('unexpected job');
  } catch (error) { c.errors = [...contextErrors(c, full), error.message]; }
  return c;
}

function processSnapshot(pids, phase, remainingMs = 700) {
  const selector = pids?.length ? ['-p', pids.join(',')] : ['-A'];
  const r = cp.spawnSync('ps', [...selector, '-o', 'pid=,ppid=,pgid=,uid=,lstart=,stat=,command='], { encoding: 'utf8', timeout: Math.max(1, Math.floor(Math.min(700, remainingMs))), maxBuffer: 4 * 1024 ** 2, env: { ...process.env, LC_ALL: 'C' } });
  if (pids?.length && r.status === 1 && !r.error && !r.stdout.trim() && !r.stderr.trim()) return [];
  if (r.status !== 0 || r.error) throw new Error('Owned-process observation failed: ' + (r.error?.message || r.stderr));
  return r.stdout.split('\n').flatMap(line => {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\w+\s+\w+\s+\d+\s+\d\d:\d\d:\d\d\s+\d{4})\s+(\S+)\s+(.*)$/);
    return m && !m[6].includes('Z') ? [{ pid: +m[1], ppid: +m[2], pgid: +m[3], uid: +m[4], start: m[5], command: m[7] }] : [];
  });
}
function sameProcess(a, b) { return !!a && !!b && ['pid', 'uid', 'pgid', 'start', 'command'].every(k => a[k] === b[k]); }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runOwned(argv, options) {
  fs.mkdirSync(options.outputDir, { recursive: true });
  const started = performance.now();
  const result = { argv, cwd: options.cwd, startedAt: stamp(), exit: null, signal: null, spawnError: null, timedOut: false, resourceStop: null, logsComplete: true, retainedLogBytes: 0, observedLogBytes: 0, omittedLogBytes: 0, cleanup: { complete: false, signals: [], errors: [], observationErrors: [], targetedVerifications: 0, finalObservation: 'pending', remaining: null, identitySource: 'native ps UID/start/PGID/command; sampled ancestry and live group anchors' } };
  const stdout = fs.openSync(path.join(options.outputDir, 'stdout.log'), 'wx');
  const stderr = fs.openSync(path.join(options.outputDir, 'stderr.log'), 'wx');
  const cap = options.maxLogBytes ?? LOG_CAP;
  const owned = new Map();
  let child, resolveExit, resolveStop, stopped = false, monitor, timer;
  const streamEnds = [];
  let observationDeadline = Infinity;
  const exited = new Promise(resolve => { resolveExit = resolve; });
  const stopping = new Promise(resolve => { resolveStop = resolve; });
  const observe = (pids, phase) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const left = observationDeadline - performance.now();
      if (left <= 0) { result.cleanup.observationErrors.push({ at: stamp(), phase, error: 'owned cleanup observation deadline exhausted' }); return null; }
      try { return (options.snapshot || processSnapshot)(pids, phase, left); }
      catch (error) { result.cleanup.observationErrors.push({ at: stamp(), phase, selector: pids ? 'targeted' : 'full', attempt, error: error.message }); }
    }
    return null;
  };
  const ownedFrom = all => {
    const live = new Map(all.map(entry => [entry.pid, entry]));
    const roots = new Set([...owned.values()].filter(entry => sameProcess(entry, live.get(entry.pid))).map(entry => entry.pid));
    const leader = live.get(child?.pid);
    if (leader && leader.ppid === process.pid && leader.pgid === child.pid && leader.uid === process.getuid() && (!owned.has(leader.pid) || owned.get(leader.pid).start === leader.start)) roots.add(leader.pid);
    const groups = new Set([...roots].map(pid => live.get(pid)?.pgid).filter(group => group === child?.pid));
    let changed;
    do {
      changed = false;
      for (const entry of all) if ((roots.has(entry.ppid) || groups.has(entry.pgid)) && !roots.has(entry.pid)) { roots.add(entry.pid); changed = true; }
    } while (changed);
    for (const entry of all) if (roots.has(entry.pid) && entry.pid !== process.pid) owned.set(entry.pid, entry);
    return all.filter(entry => sameProcess(owned.get(entry.pid), entry));
  };
  const track = phase => { const all = observe(undefined, phase); return all === null ? null : ownedFrom(all); };
  const targeted = () => {
    const pids = [...new Set([...owned.keys(), child?.pid].filter(Boolean))];
    if (!pids.length) return [];
    result.cleanup.targetedVerifications++;
    const all = observe(pids, 'cleanup');
    return all === null ? null : ownedFrom(all);
  };
  const stop = reason => {
    if (stopped) return;
    stopped = true;
    if (reason === 'watchdog') result.timedOut = true; else result.resourceStop = reason;
    resolveStop();
  };
  const onInt = () => stop('collector-SIGINT');
  const onTerm = () => stop('collector-SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  try {
    child = cp.spawn(argv[0], argv.slice(1), { cwd: options.cwd, env: options.env || process.env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    result.pid = child.pid ?? null;
    child.on('error', error => { result.spawnError = error.message; resolveExit(); });
    child.on('exit', (code, signal) => { result.exit = code; result.signal = signal; resolveExit(); });
    for (const [stream, fd] of [[child.stdout, stdout], [child.stderr, stderr]]) {
      streamEnds.push(new Promise(resolve => { if (!stream) return resolve(false); stream.on('end', () => resolve(true)); stream.on('error', () => resolve(false)); }));
      stream?.on('data', bytes => {
      const keep = Math.max(0, Math.min(bytes.length, cap - result.retainedLogBytes));
      if (keep) writeAll(fd, bytes.subarray(0, keep));
      result.retainedLogBytes += keep; result.observedLogBytes += bytes.length; result.omittedLogBytes += bytes.length - keep;
      if (keep < bytes.length) { result.logsComplete = false; stop('log-size'); }
      });
    }
    track('initial');
    monitor = setInterval(() => {
      track('monitor');
      try { if (byteSize(options.evidenceRoots || [options.outputDir], true) > (options.maxEvidenceBytes ?? EVIDENCE_CAP)) stop('evidence-size'); }
      catch (error) { result.cleanup.errors.push(error.message); stop('evidence-observation'); }
    }, 100);
    timer = setTimeout(() => stop('watchdog'), Math.max(0, options.timeoutMs));
    await Promise.race([exited, stopping]);
    clearInterval(monitor); clearTimeout(timer);
    const grace = options.graceMs || [10000, 3000, 2000];
    const shutdownStarted = performance.now();
    observationDeadline = shutdownStarted + grace.reduce((sum, value) => sum + value, 0);
    let finished = false;
    for (let i = 0; i < 3; i++) {
      const observed = track('cleanup');
      if (observed !== null && !observed.length) break;
      // A stale PID list is never authority to signal. Re-read only the known PIDs if a full snapshot is unavailable.
      const verified = observed === null ? targeted() : observed;
      const signal = ['SIGINT', 'SIGTERM', 'SIGKILL'][i];
      for (const entry of verified || []) {
        try { process.kill(entry.pid, signal); result.cleanup.signals.push({ pid: entry.pid, identity: entry, signal, at: stamp() }); }
        catch (error) { if (error.code !== 'ESRCH') result.cleanup.errors.push(error.message); }
      }
      const end = shutdownStarted + grace.slice(0, i + 1).reduce((sum, value) => sum + value, 0);
      while (performance.now() < end) {
        const current = track('cleanup');
        if (current !== null && !current.length) { finished = true; break; }
        await pause(Math.min(30, Math.max(1, end - performance.now())));
      }
      if (finished) break;
    }
    const finalObservation = track('final');
    result.cleanup.finalObservation = finalObservation === null ? 'unavailable' : 'observed';
    result.cleanup.remaining = finalObservation;
    result.cleanup.complete = finalObservation !== null && !finalObservation.length && !result.cleanup.errors.length;
    result.observer = { cadenceMs: 100, snapshotRetryLimit: 1, scope: 'collector process outside browser; CPU/IO overhead and scheduling effects unmeasured; sampled ancestry can miss transient relationships' };
    await Promise.race([exited, pause(Math.max(0, Math.min(25, observationDeadline - performance.now())))]);
    const drained = await Promise.race([Promise.all(streamEnds), pause(Math.max(0, observationDeadline - performance.now())).then(() => [false])]);
    if (!drained.every(Boolean)) { result.logsComplete = false; result.streamDrain = 'incomplete; pipe did not reach native end'; }
  } finally {
    clearInterval(monitor); clearTimeout(timer);
    child?.stdout?.destroy(); child?.stderr?.destroy();
    process.off('SIGINT', onInt); process.off('SIGTERM', onTerm);
    fs.closeSync(stdout); fs.closeSync(stderr);
    result.finishedAt = stamp(); result.elapsedMs = performance.now() - started;
  }
  return result;
}

function normalizeFile(file, report, capture) {
  const normalized = String(file || '').replaceAll('\\', '/');
  if (normalized.startsWith('tests/')) return normalized;
  const cwd = capture.cwd || root;
  const absolute = path.isAbsolute(normalized) ? normalized : path.resolve(report.config?.rootDir || path.join(cwd, 'tests'), normalized);
  return path.relative(cwd, absolute).replaceAll('\\', '/');
}
function reportCases(report, capture) {
  const cases = [];
  function visit(suite, titles, fileSuite) {
    const isFile = !fileSuite;
    const next = isFile ? titles : [...titles, suite.title].filter(Boolean);
    for (const spec of suite.specs || []) for (const test of spec.tests || []) cases.push({ project: test.projectName, file: normalizeFile(spec.file || suite.file || fileSuite?.file, report, capture), titlePath: [...next, spec.title], test });
    for (const child of suite.suites || []) visit(child, next, fileSuite || suite);
  }
  for (const suite of report?.suites || []) visit(suite, [], null);
  return cases;
}
const identity = item => JSON.stringify([item.project, item.file, item.titlePath]);
function classifyReport(report, capture) {
  const errors = [];
  const cases = reportCases(report, capture);
  const expected = new Map(EXPECTED.map(item => [identity(item), item]));
  const keys = cases.map(identity);
  const coverage = keys.length === EXPECTED.length && new Set(keys).size === EXPECTED.length && keys.every(key => expected.has(key));
  if (!coverage) errors.push('case inventory mismatch');
  if (capture.exit !== 0 || capture.signal || capture.spawnError || capture.timedOut || capture.resourceStop) errors.push('native failure or censoring');
  if (!capture.logsComplete || !capture.cleanup?.complete) errors.push('incomplete streams/cleanup');
  if (!report || !Array.isArray(report.suites) || report.errors?.length) errors.push('native report errors');
  const observations = cases.map(item => ({ project: item.project, file: item.file, titlePath: item.titlePath, timeout: item.test.timeout, outcome: item.test.status, attempts: (item.test.results || []).map(r => ({ retry: r.retry, status: r.status, durationMs: r.duration, startTime: r.startTime, workerIndex: r.workerIndex, parallelIndex: r.parallelIndex, errors: r.errors || (r.error ? [r.error] : []), classification: r.status === 'timedOut' || /Timeout|timed out/i.test(JSON.stringify(r.errors || r.error || '')) ? 'timing-censored; predicate cannot distinguish content from render/reply absence' : r.status })) }));
  for (const item of cases) {
    const required = expected.get(identity(item));
    const results = item.test.results || [];
    if (!required || results.length !== 1 || results[0].retry !== 0 || results[0].status !== required.status || !Number.isFinite(results[0].duration) || results[0].duration < 0 || results[0].error || results[0].errors?.length || ['flaky', 'unexpected'].includes(item.test.status)) errors.push('non-first-attempt result/skip/error: ' + identity(item));
  }
  const terminal = cases.find(item => item.project === 'chromium' && item.titlePath.at(-1) === 'AlphGPT terminal answers a command');
  const nativeResult = terminal?.test.results?.[0];
  const events = [];
  for (const chunk of nativeResult?.stdout || []) {
    const text = chunk.text ?? (chunk.buffer ? Buffer.from(chunk.buffer, 'base64').toString('utf8') : '');
    for (const line of text.split('\n')) {
      const match = line.match(/\[terminal-e2e\]\s+(\{.*\})\s*$/);
      if (match) { try { events.push(JSON.parse(match[1])); } catch { errors.push('invalid native terminal event'); } }
    }
  }
  const summary = events.find(event => event.event === 'summary' && event.project === 'chromium' && event.retry === 0);
  const fixture = summary?.fixture;
  const advance = (later, earlier) => later && earlier && Number.isFinite(later.frame) && Number.isFinite(later.prevTime) && later.frame > earlier.frame && later.prevTime > earlier.prevTime;
  const fixtureValid = fixture?.webdriver === false && fixture?.panelId === 'panel-alphgpt' && fixture?.rootChildren === 1 && fixture?.sceneType === 'Group' && fixture?.meshes > 0 && fixture?.composer === true && fixture?.glbStatuses?.includes(200);
  const progressValid = advance(summary?.bootHeartbeat, fixture?.heartbeat) && advance(summary?.replyHeartbeat, summary?.responseBaseline) && summary?.replyHeartbeat?.answered === true;
  if (terminal?.test.timeout !== 125000 || summary?.status !== 'passed' || summary?.runtime !== 'v24.21.0' || summary?.browser !== '149.0.7827.55' || summary?.host?.platform !== 'darwin' || summary?.host?.arch !== 'arm64' || summary?.tracePolicy !== 'on-first-retry' || summary?.errors?.length || !fixtureValid || !progressValid) errors.push('terminal timeout/real fixture/fresh-response progress evidence');
  if (!PHASES.every(title => nativeResult?.steps?.some(step => step.title === title && !step.error))) errors.push('native phase steps missing/error');
  const allResults = cases.flatMap(item => item.test.results || []);
  const complete = coverage && !!report && !report.errors?.length && allResults.length >= EXPECTED.length && cases.every(item => item.test.results?.length) && !capture.signal && !capture.spawnError && !capture.timedOut && !capture.resourceStop && capture.logsComplete && capture.cleanup?.complete;
  return { eligible: errors.length === 0, complete: !!complete, errors, nativeExit: capture.exit, nativeSignal: capture.signal, observations, terminalEvents: events, timingPolicy: 'Native protected timeouts only; phase durations are observations, absent action/setup/dispatch splits unknown. No new duration predicate.', tracePolicy: 'on-first-retry; no trace is expected on a retry-zero success, never force a retry', cohortLimit: 'Full-workload environment observation only, not a controlled comparison, percentile/capacity estimate, causal attribution or product acceptance.' };
}

function verifyArchiveFile(file, manifestHash, manifestPath = 'manifest.json', maximum = EVIDENCE_CAP, timeoutMs = 20000) {
  const program = `import sys,json,zipfile,hashlib,stat,os\ntry:\n p,h,m,cap=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4])\n assert os.path.getsize(p)<=cap,'archive-size'\n with zipfile.ZipFile(p) as z:\n  infos=z.infolist(); names=[i.filename for i in infos]\n  assert len(set(names))==len(names),'duplicate-member'\n  def safe(n):\n   return n and not n.startswith('/') and '\\\\' not in n and ':' not in n and all(v not in ['','..','.'] for v in n.rstrip('/').split('/'))\n  assert all(safe(n) for n in names),'unsafe-path'\n  assert not any(stat.S_ISLNK(i.external_attr>>16) or i.flag_bits&1 for i in infos),'symlink-or-encryption'\n  assert sum(i.file_size for i in infos)<=cap,'uncompressed-size'\n  manifest=z.read(m);assert hashlib.sha256(manifest).hexdigest()==h,'manifest-hash'\n  expected=json.loads(manifest)['members']; required={i['path']:i for i in expected}\n  assert len(required)==len(expected) and m not in required,'duplicate-manifest-path'\n  actual={i.filename for i in infos if not i.is_dir()}\n  assert actual==set(required)|{m},'member-set'\n  allowed_dirs={v[:n] for v in actual for n,c in enumerate(v) if c=='/'}\n  assert all(i.filename.rstrip('/') in allowed_dirs for i in infos if i.is_dir()),'extra-directory'\n  total=0; hashes=[]\n  for name,item in sorted(required.items()):\n   digest=hashlib.sha256(); count=0\n   with z.open(name) as f:\n    while True:\n     chunk=f.read(1048576)\n     if not chunk:break\n     count+=len(chunk);total+=len(chunk);assert total<=cap,'stream-size';digest.update(chunk)\n   assert count==item['bytes'] and digest.hexdigest()==item['sha256'],'member-hash:'+name\n   hashes.append({'path':name,'sha256':digest.hexdigest(),'bytes':count})\n  print(json.dumps({'valid':True,'members':hashes}))\nexcept Exception as e:\n print(json.dumps({'valid':False,'error':str(e)}));sys.exit(1)\n`;
  const r = cp.spawnSync('python3', ['-c', program, file, manifestHash, manifestPath, String(maximum)], { encoding: 'utf8', timeout: Math.max(1, Math.min(20000, timeoutMs)), maxBuffer: 4 * 1024 ** 2 });
  try { return { ...JSON.parse(r.stdout), nativeExit: r.status, nativeSignal: r.signal, stderr: r.stderr, nativeError: r.error?.message }; }
  catch { return { valid: false, nativeExit: r.status, error: r.error?.message || r.stderr || 'invalid ZIP verifier output' }; }
}
function cleanChildEnvironment() {
  const env = { ...process.env, CI: '1', PLAYWRIGHT_JSON_OUTPUT_NAME: 'environment-results/native-report.json' };
  for (const key of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY/.test(key)) delete env[key];
  return env;
}
function logBytes() { return files(output).filter(file => /(?:stdout|stderr)\.log$/.test(file)).reduce((n, file) => n + fs.statSync(file).size, 0); }
async function install() {
  const started = performance.now(); const deadline = started + 300000;
  const commands = [['npm', ['ci']], [process.execPath, [path.join(root, 'node_modules/playwright/cli.js'), 'install', '--with-deps', 'chromium']]];
  const receipts = [];
  if (process.versions.node !== '24.21.0') throw new Error('Wrong setup Node before install');
  for (const [command, args] of commands) {
    const r = await runOwned([command, ...args], { cwd: root, env: cleanChildEnvironment(), outputDir: path.join(output, receipts.length ? 'browser-install' : 'npm-ci'), timeoutMs: Math.max(0, deadline - performance.now() - 15000), evidenceRoots: rawRoots, maxLogBytes: Math.max(0, LOG_CAP - logBytes()) });
    receipts.push(r);
    if (r.exit !== 0 || r.signal || r.timedOut || r.resourceStop || !r.cleanup.complete) break;
  }
  const success = receipts.length === 2 && receipts.every(r => r.exit === 0 && !r.signal && !r.timedOut && !r.resourceStop && r.logsComplete && r.cleanup.complete);
  write(path.join(output, 'installation.json'), { startedAt: receipts[0]?.startedAt, finishedAt: stamp(), receipts, success, sharedDeadlineMs: 300000 });
  return success ? 0 : 1;
}
async function capture(entry) {
  const c = collectContext(true); write(path.join(output, 'identity-before-workload.json'), c);
  if (c.errors.length) return 1;
  if (fs.existsSync(path.join(output, 'native-report.json')) || fs.existsSync(path.join(root, 'test-results'))) throw new Error('Workload evidence is not fresh');
  const elapsed = performance.now() - entry;
  const r = await runOwned(['npm', 'run', 'test:e2e', '--', '--reporter=list,json'], { cwd: root, env: cleanChildEnvironment(), outputDir: path.join(output, 'workload'), timeoutMs: Math.max(0, 1065000 - elapsed), maxLogBytes: Math.max(0, LOG_CAP - logBytes()), evidenceRoots: rawRoots });
  r.ci = '1'; r.jsonOutputName = 'environment-results/native-report.json'; r.entryAnchoredWatchdogMs = 1065000; r.entryBeforeSpawnMs = elapsed;
  write(path.join(output, 'native-capture.json'), r);
  return r.exit === 0 && !r.signal && !r.timedOut && !r.resourceStop && r.logsComplete && r.cleanup.complete ? 0 : (r.exit > 0 ? r.exit : 1);
}
function classify() {
  appendOutput('eligible', 'false');
  const after = collectContext(true); write(path.join(output, 'identity-after-workload.json'), after);
  let report, receipt;
  const missing = [];
  for (const name of ['identity-before-workload.json', 'installation.json', 'native-capture.json', 'native-report.json']) if (!fs.existsSync(path.join(output, name))) missing.push(name);
  try { report = read(path.join(output, 'native-report.json')); } catch (error) { missing.push('invalid JSON: ' + error.message); }
  try { receipt = read(path.join(output, 'native-capture.json')); } catch { receipt = { exit: null, logsComplete: false, cleanup: { complete: false } }; }
  const classification = classifyReport(report, receipt);
  const before = missing.includes('identity-before-workload.json') ? null : read(path.join(output, 'identity-before-workload.json'));
  classification.errors.push(...missing, ...after.errors, ...(before?.errors || ['initial identity missing']));
  if (after.errors.length || missing.length || before?.errors?.length) classification.complete = false;
  classification.eligible = classification.eligible && classification.errors.length === 0;
  classification.actualTraceFiles = files(path.join(root, 'test-results')).filter(file => file.endsWith('.zip')).map(file => path.relative(root, file));
  write(path.join(output, 'classification.json'), classification);
  const allFiles = rawRoots.flatMap(files);
  const members = allFiles.map(file => ({ path: path.relative(root, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: digestFile(file) }));
  // A conservative ZIP-overhead margin prevents an oversized upload; originals are never removed.
  const fullFits = members.reduce((n, m) => n + m.bytes, 0) + members.reduce((n, m) => n + 4096 + Buffer.byteLength(m.path) * 16, 0) + 1048576 <= EVIDENCE_CAP;
  const selected = fullFits ? members : members.filter(m => m.bytes <= LOG_CAP && /(?:\.json|stdout\.log|stderr\.log)$/.test(m.path));
  let sum = 1048576; const bounded = selected.filter(m => { if (sum + m.bytes + 4096 + Buffer.byteLength(m.path) * 16 > EVIDENCE_CAP) return false; sum += m.bytes + 4096 + Buffer.byteLength(m.path) * 16; return true; });
  const completeUpload = fullFits && bounded.length === members.length;
  const manifest = { version: 1, createdAt: stamp(), repository: REPOSITORY, head: process.env.GITHUB_SHA, run: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT, job: process.env.GITHUB_JOB, complete: classification.complete && completeUpload, eligibleBeforeArchive: classification.eligible && completeUpload, partialReason: completeUpload ? (classification.complete ? null : 'native/identity/report capture incomplete') : 'raw set exceeds conservative complete-ZIP budget; original raw retained on VM, bounded subset only', missingMembers: members.filter(m => !bounded.includes(m)), members: bounded, limits: { logs: LOG_CAP, archive: EVIDENCE_CAP, sampledRawSoftStop: EVIDENCE_CAP }, hardwareClass: 'Fixed standard macos-15 label requested; native OS/arch/image guarded, CPU/RAM/model recorded only, no independent class/capacity attestation', observer: { cadenceMs: 100, overhead: 'additional ps/stat sampling and JSON reporter; CPU/IO/timing perturbation unmeasured, no controlled A/B claim' }, caveat: 'No artifact delivery guaranteed after platform hard kill; no silent pruning or reconstructed success.' };
  const stage = path.join(process.env.RUNNER_TEMP, 'environment-evidence-' + process.env.GITHUB_JOB);
  fs.mkdirSync(stage, { recursive: false });
  for (const member of bounded) { const to = path.join(stage, member.path); fs.mkdirSync(path.dirname(to), { recursive: true }); try { fs.linkSync(path.join(root, member.path), to); } catch { fs.copyFileSync(path.join(root, member.path), to); } }
  write(path.join(stage, 'manifest.json'), manifest);
  const metadata = { stage, manifestSha256: digestFile(path.join(stage, 'manifest.json')), artifactName: `environment-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}-${process.env.GITHUB_JOB}`, complete: manifest.complete, eligible: manifest.eligibleBeforeArchive, uploadAndVerifyDeadline: Date.now() + 120000, image: after.image };
  write(path.join(process.env.RUNNER_TEMP, 'environment-finalization.json'), metadata);
  appendOutput('path', stage); appendOutput('artifact-name', metadata.artifactName); appendOutput('image', after.image || '');
  console.log(JSON.stringify({ complete: manifest.complete, eligibleBeforeArchive: metadata.eligible, manifestSha256: metadata.manifestSha256, partialReason: manifest.partialReason, missingMembers: manifest.missingMembers.length }));
  return 0;
}
function artifactMetadataErrors(metadata, expected) {
  const errors = [];
  if (String(metadata.id) !== expected.artifactId || metadata.name !== expected.artifactName) errors.push('artifact id/name');
  if (metadata.expired !== false || !Number.isSafeInteger(metadata.size_in_bytes) || metadata.size_in_bytes < 0 || metadata.size_in_bytes > EVIDENCE_CAP) errors.push('artifact expiry/size');
  if (String(metadata.workflow_run?.id) !== expected.runId || metadata.workflow_run?.head_sha !== expected.sha || metadata.workflow_run?.head_branch !== BRANCH) errors.push('artifact run/head/ref');
  const digest = metadata.digest?.replace(/^sha256:/, '');
  if (!/^[a-f0-9]{64}$/.test(digest || '') || digest !== expected.uploaderDigest) errors.push('API/uploader digest');
  return errors;
}
async function verifyArtifact() {
  appendOutput('eligible', 'false');
  const local = read(path.join(process.env.RUNNER_TEMP, 'environment-finalization.json'));
  const verification = { startedAt: stamp(), artifactId: process.env.ARTIFACT_ID, eligible: false, deadline: local.uploadAndVerifyDeadline };
  const remaining = () => { const ms = local.uploadAndVerifyDeadline - Date.now(); if (ms <= 0) throw new Error('shared120s artifact deadline'); return ms; };
  const request = async (url, authenticated = true) => {
    const headers = authenticated ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } : {};
    return fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(Math.max(1, remaining())) });
  };
  try {
    if (!/^\d+$/.test(process.env.ARTIFACT_ID || '')) throw new Error('missing artifact id');
    const api = `https://api.github.com/repos/${REPOSITORY}/actions/artifacts/${process.env.ARTIFACT_ID}`;
    const response = await request(api);
    if (!response.ok) throw new Error('artifact metadata HTTP' + response.status);
    const metadata = await response.json(); verification.api = metadata;
    const metadataErrors = artifactMetadataErrors(metadata, { artifactId: process.env.ARTIFACT_ID, artifactName: local.artifactName, runId: process.env.GITHUB_RUN_ID, sha: process.env.GITHUB_SHA, uploaderDigest: process.env.ARTIFACT_DIGEST });
    if (metadataErrors.length) throw new Error(metadataErrors.join('; '));
    const apiDigest = metadata.digest.replace(/^sha256:/, '');
    const redirect = await request(api + '/zip');
    if (redirect.status !== 302) throw new Error('artifact download redirect HTTP' + redirect.status);
    const location = new URL(redirect.headers.get('location'));
    if (location.protocol !== 'https:') throw new Error('unsafe artifact download URL');
    const download = await request(location.href, false);
    if (!download.ok) throw new Error('archive HTTP' + download.status);
    const zip = path.join(process.env.RUNNER_TEMP, 'environment-original.zip');
    const fd = fs.openSync(zip, 'wx'); const hash = crypto.createHash('sha256'); let count = 0;
    try { for await (const chunk of download.body) { remaining(); count += chunk.length; if (count > EVIDENCE_CAP) throw new Error('download byte cap'); writeAll(fd, chunk); hash.update(chunk); } }
    finally { fs.closeSync(fd); }
    verification.originalZipBytes = count; verification.originalZipSha256 = hash.digest('hex');
    if (verification.originalZipSha256 !== apiDigest || count !== metadata.size_in_bytes) throw new Error('original ZIP/API bytes/digest');
    remaining(); verification.members = verifyArchiveFile(zip, local.manifestSha256, 'manifest.json', EVIDENCE_CAP, remaining());
    remaining();
    if (!verification.members.valid) throw new Error('original ZIP member verification');
    verification.eligible = local.eligible && local.complete;
    verification.completeArchiveVerified = true;
    if (!verification.eligible) throw new Error('native workload/integrity/coverage is ineligible; original archive retained');
    appendOutput('eligible', 'true');
  } catch (error) { verification.error = error.message; }
  verification.finishedAt = stamp();
  write(path.join(process.env.RUNNER_TEMP, 'environment-archive-verification.json'), verification);
  console.log(JSON.stringify(verification));
  return verification.eligible ? 0 : 1;
}
async function main() {
  const entry = performance.now();
  const mode = process.argv[2];
  if (mode === 'guard' && process.argv.length === 3) {
    fs.mkdirSync(output, { recursive: false });
    const c = collectContext(false); write(path.join(output, 'identity-admission.json'), c); appendOutput('image', c.image || '');
    console.log(JSON.stringify(c)); return c.errors.length ? 1 : 0;
  }
  if (mode === 'capture' && process.argv[3] === 'install' && process.argv.length === 4) return install();
  if (mode === 'capture' && process.argv.length === 3) return capture(entry);
  if (mode === 'classify' && process.argv.length === 3) return classify();
  if (mode === 'verify-artifact' && process.argv.length === 3) return verifyArtifact();
  throw new Error('Expected guard, capture [install], classify or verify-artifact; no custom workload or deadline options.');
}
module.exports = { contextErrors, sameProcess, runOwned, classifyReport, verifyArchiveFile, artifactMetadataErrors, processSnapshot, byteSize, writeAll };
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.stack); process.exitCode = 1; });
