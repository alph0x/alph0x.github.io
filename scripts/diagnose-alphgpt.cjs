#!/usr/bin/env node
'use strict';

/**
 * Collect bounded diagnostic copies without changing acceptance or graphics.
 * Usage: node scripts/diagnose-alphgpt.cjs [--output NEW_DIRECTORY] [--samples 1] [--validate]
 * Default: three U/T/U samples; native errors/censoring remain diagnostic data.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const protectedHash = '80ec6b804fc33dcd1546a23cc7031c3e2d0cb3ea21d42673aecb05be8c033152';
const policy = Object.freeze({ case: 420000, boot: 120000, open: 120000, send: 120000, reply: 30000, accounting: 30000, fill: 60000, enter: 40000, child: 450000, collection: 1320000 });
const phases = ['Real game boot', 'Open terminal through E and zoom', 'Send help', 'Fresh bot command response with active render'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const json = (file, value) => {
  const temporary = `${file}.pending`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  fs.renameSync(temporary, file);
};
function once(source, anchor, replacement) {
  if (source.split(anchor).length !== 2) throw new Error(`Expected exactly one transformation anchor: ${anchor}`);
  return source.replace(anchor, replacement);
}
function generate(source) {
  if (hash(source) !== protectedHash) throw new Error('Protected acceptance source SHA-256 mismatch; refusing generation');
  let copy = once(source, "require('@playwright/test')", `require(${JSON.stringify(require.resolve('@playwright/test', { paths: [root] }))})`);
  copy = once(copy, 'test.describe.configure({ timeout: 125000 });', 'test.describe.configure({ timeout: 420000 });');
  // This helper is only exercised by the selected diagnostic case.
  copy = once(copy, '    { timeout: 60000 }\n  );', '    { timeout: 120000 }\n  );');
  const start = copy.indexOf("    test('AlphGPT terminal answers a command',");
  const endAnchor = '\n    });\n  });';
  const end = copy.indexOf(endAnchor, start);
  if (start < 0 || end < 0 || copy.indexOf("    test('AlphGPT terminal answers a command',", start + 1) !== -1) throw new Error('Ambiguous terminal case boundaries');
  let body = copy.slice(start, end);
  const edits = [
    ["phase('Real game boot', 60000", "phase('Real game boot', 120000"],
    ["phase('Open terminal through E and zoom', 30000", "phase('Open terminal through E and zoom', 120000"],
    ["phase('Send help', 20000", "phase('Send help', 120000"],
    ["phase('Fresh bot command response with active render', 10000", "phase('Fresh bot command response with active render', 30000"],
    ["boot(page, { timeout: 60000 })", "boot(page, { timeout: 120000 })"],
    ['initial, { timeout: 60000 }', 'initial, { timeout: 120000 }'],
    ["page.waitForSelector('#panel-alphgpt.active.terminal-mode', { timeout: 30000 })", "page.waitForSelector('#panel-alphgpt.active.terminal-mode', { timeout: 120000 })"],
    ["input.waitFor({ state: 'visible', timeout: 30000 })", "input.waitFor({ state: 'visible', timeout: 120000 })"],
    ['expect(input).toBeEnabled({ timeout: 30000 })', 'expect(input).toBeEnabled({ timeout: 120000 })'],
    ["input.fill('help', { timeout: 15000 })", "input.fill('help', { timeout: 60000 })"],
    ["input.press('Enter', { timeout: 5000 })", "input.press('Enter', { timeout: 40000 })"],
    ['          timeout: 10000,', '          timeout: 30000,'],
  ];
  for (const [anchor, replacement] of edits) body = once(body, anchor, replacement);
  body = once(body, '      diagnostics.set(testInfo, state);', `      diagnostics.set(testInfo, state);
      const emit = record => require('node:fs').appendFileSync(process.env.ALPHGPT_OBSERVATIONS,
        JSON.stringify({ ...record, monotonicMs: performance.now(), wallTime: new Date().toISOString() }) + '\\n');
      let currentAction;
      const closeAction = (outcome, error) => {
        if (!currentAction) return;
        emit({ event: 'action-' + outcome, ...currentAction,
          durationMs: performance.now() - currentAction.startedMs, message: error?.message });
        currentAction = undefined;
      };
      let action = state.activeAction;
      Object.defineProperty(state, 'activeAction', {
        enumerable: true,
        get: () => action,
        set: value => {
          closeAction('end');
          action = value;
          currentAction = { action: value, phase: state.activePhase, startedMs: performance.now() };
          emit({ event: 'action-start', ...currentAction });
        },
      });
      state.activeAction = action;
      emit({ event: 'case-start', project: testInfo.project.name, browser: state.browser, viewport: state.viewport });`);
  body = once(body, '        state.activePhase = name;', `        closeAction('end');
        state.activePhase = name;
        emit({ event: 'phase-start', phase: name, timeout });`);
  body = once(body, '          const result = await test.step(name, work, { timeout });', `          const result = await test.step(name, work, { timeout });
          closeAction('end');
          emit({ event: 'phase-end', phase: name, durationMs: performance.now() - started });`);
  body = once(body, '          return result;\n        } catch (error) {', `          return result;
        } catch (error) {
          closeAction('error', error);
          emit({ event: 'phase-error', phase: name, action: state.activeAction,
            durationMs: performance.now() - started, message: error.message });`);
  body += "\n      emit({ event: 'case-end', fixture: state.fixture, bootHeartbeat: state.bootHeartbeat, openHeartbeat: state.openHeartbeat, responseBaseline: state.responseBaseline, replyHeartbeat: state.replyHeartbeat });";
  return copy.slice(0, start) + body + copy.slice(end);
}
function options() {
  const result = { output: path.join(root, 'alphgpt-diagnostics'), samples: 3, validate: false };
  const args = process.argv.slice(2);
  while (args.length) {
    const arg = args.shift();
    if (arg === '--validate') result.validate = true;
    else if (arg === '--output' && args[0] && !args[0].startsWith('--')) result.output = path.resolve(args.shift());
    else if (arg === '--samples' && args.shift() === '1') result.samples = 1;
    else throw new Error(`Unsupported option or value: ${arg}`);
  }
  return result;
}
function checkoutMetadata() {
  try {
    let directory = path.join(root, '.git');
    if (fs.statSync(directory).isFile()) directory = path.resolve(root, fs.readFileSync(directory, 'utf8').trim().replace(/^gitdir: /, ''));
    const head = fs.readFileSync(path.join(directory, 'HEAD'), 'utf8').trim();
    let commit = head;
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5);
      try { commit = fs.readFileSync(path.join(directory, ref), 'utf8').trim(); }
      catch {
        const packed = fs.readFileSync(path.join(directory, 'packed-refs'), 'utf8').split('\n').find(line => line.endsWith(` ${ref}`));
        commit = packed ? packed.split(' ')[0] : 'unknown';
      }
    }
    return { head: /^[a-f0-9]{40,64}$/.test(commit) ? commit : 'unknown', ref: head.startsWith('ref: ') ? head.slice(5) : 'detached', base: process.env.GITHUB_BASE_SHA || 'unknown', eventBefore: process.env.ALPHGPT_EVENT_BEFORE || 'unknown' };
  } catch { return { head: 'unknown', base: 'unknown', eventBefore: process.env.ALPHGPT_EVENT_BEFORE || 'unknown' }; }
}
function observations(file) {
  const records = [];
  let malformed = false;
  if (!fs.existsSync(file)) return { records, malformed, missing: true };
  for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
    try { records.push(JSON.parse(line)); } catch { malformed = true; }
  }
  return { records, malformed, missing: false };
}
function nativeTests(report) {
  const result = [];
  function visit(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) result.push({ title: spec.title, ...test });
    for (const child of suite.suites || []) visit(child);
  }
  visit(report);
  return result;
}
function processSnapshot() {
  return execFileSync('ps', ['-A', '-o', 'pid=,ppid=,pgid=,stat=,lstart='], { encoding: 'utf8', timeout: 2000, maxBuffer: 4 * 1024 * 1024 })
    .split('\n').flatMap(line => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
      return match && !match[4].includes('Z') ? [{ pid: Number(match[1]), parent: Number(match[2]), group: Number(match[3]), identity: match[5] }] : [];
    });
}
function classifySample({ stopReason, spawnError, observed, report, tests, native }) {
  const started = observed.records.some(record => record.event === 'case-start');
  const result = tests[0]?.results?.[0];
  const phaseError = observed.records.find(record => record.event === 'phase-error');
  const errors = [...(report?.errors || []), ...(result?.errors || []), ...(result?.error ? [result.error] : [])];
  const plain = message => (message || '').replace(/\x1b\[[0-9;]*m/g, '');
  const messages = errors.map(error => plain(error.message));
  const primaryError = result?.error || result?.errors?.[0];
  const primaryMessage = plain(primaryError?.message);
  const phaseMessage = plain(phaseError?.message);
  const deadlineError = /(?:Step|Test) timeout of [\d.]+ms|Timeout:?\s*[\d.]+ms/i.test(primaryMessage + '\n' + phaseMessage);
  const assertionFailed = result?.status === 'failed' && !deadlineError && (primaryError?.matcherResult || /(?:^|\n)\s*(?:Error: )?expect(?:\.poll)?(?:\(|:)/.test(primaryMessage));
  const globalTimeout = messages.some(message => /timed out waiting [\d.]+s for the .+ to run/i.test(message));
  if (stopReason === 'collection-watchdog') return 'collection-watchdog';
  if (stopReason === 'child-watchdog' || globalTimeout) return started ? 'action/phase timeout' : 'not-reached';
  if (stopReason || spawnError || observed.malformed || observed.missing || tests.length !== 1 || !result || !started) return 'infrastructure-error';
  if (result.status === 'timedOut' || deadlineError || (!assertionFailed && /Timeout|timed out/i.test(primaryMessage + '\n' + phaseMessage))) return 'action/phase timeout';
  if (report?.errors?.length) return 'infrastructure-error';
  if (result.status === 'passed' && native?.code === 0 && observed.records.some(record => record.event === 'case-end')) return 'completed';
  if (assertionFailed) return 'assertion-failed';
  return 'infrastructure-error';
}
async function runSample(sample, deadline, manifest, save) {
  const directory = sample.directory;
  const eventFile = path.join(directory, 'observations.jsonl');
  const reportFile = path.join(directory, 'native-report.json');
  const configFile = path.join(directory, 'playwright.config.cjs');
  const specFile = path.join(directory, 'interactions.spec.cjs');
  fs.mkdirSync(directory);
  fs.writeFileSync(specFile, manifest.generatedSpec, { flag: 'wx' });
  const config = `const base = require(${JSON.stringify(path.join(root, 'playwright.config.cjs'))});\nmodule.exports = { ...base, testDir: __dirname, testMatch: 'interactions.spec.cjs', fullyParallel: false, retries: 0, workers: 1, timeout: ${policy.case}, globalTimeout: ${policy.child - 5000}, outputDir: ${JSON.stringify(path.join(directory, 'test-results'))}, reporter: [['list'], ['json', { outputFile: ${JSON.stringify(reportFile)} }]], projects: base.projects.filter(project => project.name === 'chromium'), use: { ...base.use, trace: ${JSON.stringify(sample.trace ? 'on' : 'off')} }, webServer: { ...base.webServer, cwd: ${JSON.stringify(root)}, reuseExistingServer: false } };\n`;
  fs.writeFileSync(configFile, config, { flag: 'wx' });
  sample.generatedHashes = { spec: hash(manifest.generatedSpec), config: hash(config) };
  sample.startedAt = new Date().toISOString();
  sample.resources = { loadAverage: os.loadavg(), freeMemoryBytes: os.freemem() };
  save();
  const stdout = fs.createWriteStream(path.join(directory, 'stdout.log'), { flags: 'wx' });
  const stderr = fs.createWriteStream(path.join(directory, 'stderr.log'), { flags: 'wx' });
  const started = performance.now();
  let child;
  let stopReason;
  let streamBytes = 0;
  let killTimer;
  let escalationTimer;
  const owned = new Map();
  sample.cleanup = { trackingIntervalMs: 1000, signals: [], errors: [] };
  const track = () => {
    try {
      const processes = processSnapshot();
      const descendants = new Set(child?.pid ? [child.pid] : []);
      let added;
      do {
        added = false;
        for (const entry of processes) if (descendants.has(entry.parent) && !descendants.has(entry.pid)) {
          descendants.add(entry.pid);
          added = true;
        }
      } while (added);
      for (const entry of processes) if (descendants.has(entry.pid)) owned.set(entry.pid, entry);
      return processes.filter(entry => owned.get(entry.pid)?.identity === entry.identity);
    } catch (error) {
      sample.cleanup.errors.push(error.message);
      return [];
    }
  };
  const signalGroups = signal => {
    const groups = new Set(track().map(entry => entry.group));
    if (child?.pid && child.exitCode === null && child.signalCode === null) groups.add(child.pid);
    for (const group of groups) {
      try { process.kill(-group, signal); sample.cleanup.signals.push({ group, signal, at: new Date().toISOString() }); }
      catch (error) { if (error.code !== 'ESRCH') sample.cleanup.errors.push(error.message); }
    }
  };
  const stop = reason => {
    if (stopReason) return;
    stopReason = reason;
    sample.stopReason = reason;
    track();
    save();
    // Playwright handles SIGINT; allow native reporters and traces to finalize.
    if (child?.pid) {
      try { process.kill(child.pid, 'SIGINT'); } catch (error) { if (error.code !== 'ESRCH') sample.cleanup.errors.push(error.message); }
      escalationTimer = setTimeout(() => {
        signalGroups('SIGTERM');
        killTimer = setTimeout(() => signalGroups('SIGKILL'), 2000);
      }, 10000);
    }
  };
  const interrupt = signal => stop(`parent-${signal}`);
  const onTerm = () => interrupt('SIGTERM');
  const onInt = () => interrupt('SIGINT');
  process.on('SIGTERM', onTerm);
  process.on('SIGINT', onInt);
  let spawnError;
  let native;
  let watchdog;
  try {
    child = spawn(process.execPath, [require.resolve('@playwright/test/cli', { paths: [root] }), 'test', '--config', configFile, '--project', 'chromium', '--workers', '1', '--retries', '0', '-g', 'Terminal command response AlphGPT terminal answers a command$'], {
      cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ALPHGPT_OBSERVATIONS: eventFile },
    });
    sample.pid = child.pid ?? null;
    const capture = (stream, destination) => stream.on('data', chunk => {
      destination.write(chunk);
      streamBytes += chunk.length;
    });
    capture(child.stdout, stdout);
    capture(child.stderr, stderr);
    track();
    const tracking = setInterval(track, sample.cleanup.trackingIntervalMs);
    child.once('close', () => clearInterval(tracking));
    watchdog = setInterval(() => {
      if (Date.now() >= deadline) return stop('collection-watchdog');
      if (performance.now() - started >= policy.child) return stop('child-watchdog');
    }, 500);
    native = await new Promise(resolve => {
      child.on('error', error => { spawnError = error.message; });
      child.on('close', (code, signal) => resolve({ code, signal }));
    });
  } finally {
    clearInterval(watchdog);
    // Include detached Playwright browser/server groups observed while owned.
    signalGroups('SIGKILL');
    clearTimeout(escalationTimer);
    clearTimeout(killTimer);
    await new Promise(resolve => setTimeout(resolve, 250));
    sample.cleanup.remaining = track();
    sample.cleanup.tracked = [...owned.values()];
    process.off('SIGTERM', onTerm);
    process.off('SIGINT', onInt);
    await Promise.all([new Promise(resolve => stdout.end(resolve)), new Promise(resolve => stderr.end(resolve))]);
  }
  sample.native = native;
  sample.spawnError = spawnError;
  sample.durationMs = performance.now() - started;
  sample.finishedAt = new Date().toISOString();
  sample.streamBytesObserved = streamBytes;
  const observed = observations(eventFile);
  sample.observationIntegrity = { missing: observed.missing, malformed: observed.malformed };
  let report;
  try { report = JSON.parse(fs.readFileSync(reportFile, 'utf8')); } catch (error) { sample.reportError = error.message; }
  const tests = report ? nativeTests(report) : [];
  sample.nativeResults = tests;
  sample.classification = classifySample({ stopReason, spawnError, observed, report, tests, native });
  if (sample.cleanup.errors.length || sample.cleanup.remaining.length) sample.classification = 'infrastructure-error';
  sample.phases = phases.map(phase => {
    const records = observed.records.filter(record => record.phase === phase);
    const end = records.find(record => record.event === 'phase-end');
    const error = records.find(record => record.event === 'phase-error');
    return { phase, classification: end ? 'completed' : error ? sample.classification : records.length ? sample.classification : 'not-reached', completedDurationMs: end?.durationMs ?? null, observations: records };
  });
  const final = observed.records.find(record => record.event === 'case-end');
  if (final) {
    const boundaries = [final.fixture?.heartbeat, final.bootHeartbeat, final.openHeartbeat, final.responseBaseline, final.replyHeartbeat];
    sample.counterIncrements = boundaries.slice(1).map((current, index) => {
      const previous = boundaries[index];
      return { from: ['fixture', 'boot', 'open', 'responseBaseline'][index], to: ['boot', 'open', 'responseBaseline', 'reply'][index], frame: current && previous ? current.frame - previous.frame : null, prevTime: current && previous ? current.prevTime - previous.prevTime : null };
    });
  }
  save();
  return Boolean(stopReason || sample.cleanup.errors.length || sample.cleanup.remaining.length);
}
async function main() {
  const args = options();
  // mkdir is deliberately non-recursive and exclusive: no prior evidence is overwritten.
  fs.mkdirSync(args.output);
  const manifestFile = path.join(args.output, 'manifest.json');
  const summaryFile = path.join(args.output, 'summary.json');
  const manifest = { schemaVersion: 1, diagnosticOnly: true, productAcceptance: 'not evaluated', createdAt: new Date().toISOString(), policy, policyNotice: 'Limits are observation policies, not measurements or guaranteed artifact delivery after platform termination.', samples: [], errors: [] };
  const save = () => { const { generatedSpec, ...serializable } = manifest; json(manifestFile, serializable); };
  try {
    if (process.platform === 'win32') throw new Error('Owned process-group termination requires a POSIX host');
    const source = fs.readFileSync(path.join(root, 'tests/e2e/interactions.spec.cjs'), 'utf8');
    const config = fs.readFileSync(path.join(root, 'playwright.config.cjs'));
    const inputFiles = { acceptance: 'tests/e2e/interactions.spec.cjs', config: 'playwright.config.cjs', script: path.relative(root, __filename), lock: 'package-lock.json', workflow: '.github/workflows/alphgpt-diagnostics.yml' };
    manifest.inputHashes = Object.fromEntries(Object.entries(inputFiles).map(([name, file]) => [name, hash(fs.readFileSync(path.join(root, file)))]));
    manifest.github = { sha: process.env.GITHUB_SHA || 'unknown', runId: process.env.GITHUB_RUN_ID || 'unknown', runAttempt: process.env.GITHUB_RUN_ATTEMPT || 'unknown' };
    manifest.generatedSpec = generate(source);
    const base = require(path.join(root, 'playwright.config.cjs'));
    if (base.projects.filter(project => project.name === 'chromium').length !== 1 || !base.webServer || Array.isArray(base.webServer)) throw new Error('Expected one desktop chromium project and one native webServer');
    manifest.environment = { node: process.version, playwright: require('@playwright/test/package.json').version, browser: 'recorded by each native case when reached', platform: os.platform(), release: os.release(), arch: os.arch(), hostname: os.hostname(), cpu: os.cpus(), totalMemoryBytes: os.totalmem(), freeMemoryBytes: os.freemem(), loadAverage: os.loadavg(), runnerOS: process.env.RUNNER_OS || 'unknown', runnerArch: process.env.RUNNER_ARCH || 'unknown', imageOS: process.env.ImageOS || 'unknown', imageVersion: process.env.ImageVersion || 'unknown', vmIdentity: 'unknown', checkout: checkoutMetadata(), workers: 1, retries: 0, project: 'chromium', inheritedUse: base.use, projectUse: base.projects.find(project => project.name === 'chromium').use };
    manifest.generatedSpecHash = hash(manifest.generatedSpec);
    save();
    if (args.validate) {
      fs.writeFileSync(path.join(args.output, 'validated-interactions.spec.cjs'), manifest.generatedSpec, { flag: 'wx' });
      manifest.validation = 'source generation only; no browser or native runner executed';
      save();
    } else {
      const deadline = Date.now() + policy.collection;
      const order = args.samples === 1 ? [false] : [false, true, false];
      manifest.samples = order.map((trace, index) => ({ index: index + 1, trace, label: trace ? 'T' : 'U', classification: 'not-reached', directory: path.join(args.output, `sample-${index + 1}-${trace ? 'traced' : 'untraced'}`) }));
      save();
      for (const sample of manifest.samples) {
        if (Date.now() >= deadline) { manifest.collectionLimitReached = true; break; }
        if (await runSample(sample, deadline, manifest, save)) break;
      }
    }
    manifest.finalInputHashes = Object.fromEntries(Object.entries(inputFiles).map(([name, file]) => [name, hash(fs.readFileSync(path.join(root, file)))]));
    if (JSON.stringify(manifest.inputHashes) !== JSON.stringify(manifest.finalInputHashes)) throw new Error('Diagnostic inputs changed during collection');
  } catch (error) {
    manifest.errors.push({ message: error.message, stack: error.stack });
  } finally {
    manifest.finishedAt = new Date().toISOString();
    save();
    const counts = Object.fromEntries(['completed', 'action/phase timeout', 'collection-watchdog', 'not-reached', 'assertion-failed', 'infrastructure-error'].map(name => [name, manifest.samples.filter(sample => sample.classification === name).length]));
    const summary = { schemaVersion: 1, diagnosticOnly: true, productAcceptance: 'not evaluated', validationOnly: args.validate, plannedSamples: args.validate ? 0 : args.samples, counts, errors: manifest.errors, samples: manifest.samples.map(({ index, label, classification, native, stopReason }) => ({ index, label, classification, native, stopReason })), interpretation: 'Censored and assertion-failed samples remain in the denominator. Action starts without native completion are not completed durations. Counter increments are boundary covariates, not FPS or causal CPU/GPU evidence. Native failure is never a product PASS. Platform hard termination may prevent final artifacts.' };
    json(summaryFile, summary);
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = manifest.errors.length || (!args.validate && manifest.samples.some(sample => sample.classification !== 'completed')) ? 1 : 0;
  }
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
