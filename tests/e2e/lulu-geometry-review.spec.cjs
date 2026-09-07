const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { PNG } = require('playwright-core/lib/utilsBundle');

const ROOT = path.resolve(__dirname, '../..');
const TIME = '2026-09-04T14:00:00-03:00';
const RANDOM_SEED = 0x1a2b3c4d;
const SEED = fs.readFileSync(path.join(ROOT, 'docs/js/core.ts'), 'utf8').match(/export const DEFAULT_SEED = '([^']+)'/)[1];
const RESTS = { body: [0, 0, 0], head: [0, 0.19, 0.145], tail: [0, 0.12, -0.255], earL: [-0.061, 0.078, -0.006], earR: [0.061, 0.078, -0.006] };
const VIEWS = [
  { name: 'front-three-quarter', position: [0.34, 0.34, 0.55], target: [0, 0.14, 0.07], local: true },
  { name: 'profile', position: [0.56, 0.27, 0.02], target: [0, 0.12, 0], local: true },
  { name: 'top-silhouette', position: [0.16, 0.70, 0.12], target: [0, 0.04, 0], local: true },
  { name: 'in-room', position: [-0.2, 1.4, -0.3], target: [-0.7, 0.89, -0.9], local: false },
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const writeJSON = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

function freshOutput(testInfo) {
  if (!process.env.VISUAL_OUTPUT_DIR) throw new Error('VISUAL_OUTPUT_DIR must name a fresh isolated directory');
  const output = path.resolve(process.env.VISUAL_OUTPUT_DIR);
  const parent = path.dirname(output);
  if (fs.existsSync(output) || fs.realpathSync(parent) !== parent || /(?:^|\/)(?:\.git|node_modules|screenshots|[^/]*snapshots[^/]*)(?:\/|$)/i.test(output)) {
    throw new Error('VISUAL_OUTPUT_DIR must be new, outside screenshot/snapshot directories, and without symlinks');
  }
  const runner = path.resolve(testInfo.project.outputDir);
  if (output === runner || output.startsWith(`${runner}/`) || runner.startsWith(`${output}/`)) throw new Error('Image and Playwright output directories must be disjoint');
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
  if (tracked.some((file) => path.resolve(ROOT, file).startsWith(`${output}/`) || path.resolve(ROOT, file) === output)) throw new Error('Refusing a tracked output destination');
  fs.mkdirSync(output);
  return output;
}

async function openRoom(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, timezoneId: 'America/Argentina/Buenos_Aires', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [], resources = [], pending = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith('/assets/')) pending.push(response.body().then((body) => resources.push({ path: pathname, status: response.status(), sha256: sha(body) })));
  });
  await page.clock.install({ time: new Date('2026-09-04T13:59:59-03:00') });
  await page.clock.pauseAt(new Date(TIME));
  await page.addInitScript(({ seed, time }) => {
    Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => false });
    const clockNow = performance.now.bind(performance), origin = clockNow();
    Object.defineProperty(performance, 'now', { configurable: true, value: () => clockNow() - origin });
    let nextFrame = 0;
    const callbacks = new Map();
    window.requestAnimationFrame = (callback) => { callbacks.set(++nextFrame, callback); return nextFrame; };
    window.cancelAnimationFrame = (id) => callbacks.delete(id);
    window.__luluCaptureFrames = { count: 0, drain() {
      const pending = [...callbacks.values()]; callbacks.clear();
      for (const callback of pending) callback(performance.now());
      this.count++;
    } };
    HTMLElement.prototype.requestPointerLock = function () {
      Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => this });
      document.dispatchEvent(new Event('pointerlockchange'));
      return Promise.resolve();
    };
    let state = seed;
    Math.random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
    window.__TIME_OF_DAY_NOW__ = new Date(time);
  }, { seed: RANDOM_SEED, time: TIME });
  await page.goto(`${baseURL}/?seed=${encodeURIComponent(SEED)}`, { waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => !!(window.__game?.worldState.pet?.mesh && window.__scene?.environment)), { timeout: 30000 }).toBe(true);
  await Promise.all(pending);
  const storage = await page.evaluate(async () => ({ workers: (await navigator.serviceWorker.getRegistrations()).length, caches: await caches.keys(), snapshotBypass: window.__snapshotMode === true, webdriver: navigator.webdriver }));
  expect(storage).toEqual({ workers: 0, caches: [], snapshotBypass: false, webdriver: false });
  expect(resources.some((resource) => resource.path.endsWith('/dusk_1k.hdr') && resource.status === 200)).toBe(true);
  expect(resources.every((resource) => resource.status === 200)).toBe(true);
  expect(resources.some((resource) => resource.path === '/assets/models/macbook.glb')).toBe(true);
  const externalModel = await page.evaluate(async () => {
    const { shouldLoadExternalModels } = await import('/js/assets/loader.ts');
    const macbook = window.__game.worldState.room.interactables.find((item) => item.label === 'MACBOOK').mesh;
    return { enabled: shouldLoadExternalModels(), wrapperChildren: macbook.children.length, loadedSceneType: macbook.children[0].type, loadedSceneChildren: macbook.children[0].children.length };
  });
  expect(externalModel.enabled).toBe(true);
  expect(externalModel.wrapperChildren).toBe(1);
  expect(externalModel.loadedSceneType).toBe('Group');
  expect(externalModel.loadedSceneChildren).toBeGreaterThan(0);
  console.log('Production HDR and external MacBook loaded; animation clock paused');
  return { context, page, errors, externalModel, resources: resources.sort((a, b) => a.path.localeCompare(b.path)) };
}

async function advanceFrames(page, count) {
  for (let frame = 0; frame < count; frame++) {
    await page.clock.runFor(16);
    await page.evaluate(() => window.__luluCaptureFrames.drain());
  }
}

async function enterRoom(page) {
  await advanceFrames(page, 25);
  await page.clock.setFixedTime(new Date(TIME));
  await page.locator('#start-btn').click({ force: true });
  const entry = await page.evaluate(() => ({ locked: window.__game.controls.isLocked, loadingHidden: getComputedStyle(document.getElementById('loading')).display === 'none', startHidden: getComputedStyle(document.getElementById('start-screen')).display === 'none', fallbackActive: document.getElementById('error-display').dataset.fallbackActive === 'true' }));
  expect(entry).toEqual({ locked: true, loadingHidden: true, startHidden: true, fallbackActive: false });
  return { ...entry, pointerLock: 'test-only DOM pointerlockchange shim; native browser permission is not being tested' };
}

async function measure(page) {
  return page.evaluate((rests) => {
    const game = window.__game, root = game.worldState.pet.mesh;
    root.updateWorldMatrix(true, true);
    const transform = (object) => ({ position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z], scale: object.scale.toArray(), parent: object.parent === root ? 'root' : object.parent?.name });
    const inverse = root.matrixWorld.clone().invert(), point = root.position.clone();
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const materials = new Set(), meshes = [], pivots = {};
    let finite = true;
    root.traverse((object) => {
      finite &&= object.matrixWorld.elements.every(Number.isFinite);
      if (Object.hasOwn(rests, object.name)) {
        if (pivots[object.name]) throw new Error(`Duplicate pivot ${object.name}`);
        pivots[object.name] = { type: object.type, ...transform(object) };
      }
      if (!object.isMesh) return;
      const geometry = object.geometry, positions = geometry.getAttribute('position');
      for (const attribute of Object.values(geometry.attributes)) finite &&= Array.from(attribute.array).every(Number.isFinite);
      const meshMin = [Infinity, Infinity, Infinity], meshMax = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);
        point.toArray().forEach((value, axis) => { min[axis] = Math.min(min[axis], value); max[axis] = Math.max(max[axis], value); meshMin[axis] = Math.min(meshMin[axis], value); meshMax[axis] = Math.max(meshMax[axis], value); });
      }
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
      meshes.push({ name: object.name, ...transform(object), triangles: (geometry.index?.count ?? positions.count) / 3, vertices: positions.count, visible: object.visible, drawRange: { start: geometry.drawRange.start, count: Number.isFinite(geometry.drawRange.count) ? geometry.drawRange.count : 'Infinity' }, bounds: { min: meshMin, max: meshMax } });
    });
    const size = max.map((value, axis) => value - min[axis]);
    const nodes = ['nose', 'frontLegL', 'frontLegR', 'legFurnishingL', 'legFurnishingR', 'frontPawL', 'frontPawR'].map((name) => { const node = root.getObjectByName(name); return { name, parent: node.parent === root ? 'root' : node.parent.name, worldPosition: node.getWorldPosition(point).toArray() }; });
    const contacts = [['coatBase', 'chestFurnishing'], ['chestFurnishing', 'frontLegL'], ['chestFurnishing', 'frontLegR'], ['frontLegL', 'legFurnishingL'], ['frontLegR', 'legFurnishingR'], ['legFurnishingL', 'frontPawL'], ['legFurnishingR', 'frontPawR']].map(([a, b]) => {
      const first = meshes.find((mesh) => mesh.name === a).bounds, second = meshes.find((mesh) => mesh.name === b).bounds;
      return { pair: [a, b], signedAxisSeparation: first.min.map((value, axis) => Math.max(value - second.max[axis], second.min[axis] - first.max[axis])) };
    });
    return { finite, contacts, cost: { meshes: meshes.length, materials: materials.size, triangles: meshes.reduce((sum, mesh) => sum + mesh.triangles, 0) }, bounds: { min, max, size, lengthHeightRatio: size[2] / size[1] }, root: transform(root), pivots, meshes, nodes, model: { sleeping: game.worldState.pet.model.isSleeping, excited: game.worldState.pet.model.isExcited, headRotation: game.worldState.pet.model.headRotation, distance: game.worldState.pet.model.distToPlayer }, clock: { date: new Date().toISOString(), localHour: new Date().getHours(), performance: performance.now(), gameFrameTime: game.prevTime, deliveredFrames: window.__luluCaptureFrames.count, lightingHour: window.__TIME_OF_DAY_NOW__.getHours() } };
  }, RESTS);
}

function assertGeometry(metrics, rest = false) {
  expect(metrics.finite).toBe(true);
  for (const value of Object.values(metrics.cost)) expect(Number.isInteger(value) && value >= 0).toBe(true);
  expect(metrics.cost.meshes).toBeLessThanOrEqual(44);
  expect(metrics.cost.materials).toBeLessThanOrEqual(7);
  expect(metrics.cost.triangles).toBeLessThan(9000);
  expect(Object.keys(metrics.pivots).sort()).toEqual(Object.keys(RESTS).sort());
  for (const [name, position] of Object.entries(RESTS)) {
    expect(metrics.pivots[name].type).toBe('Group');
    expect(metrics.pivots[name].position).toEqual(position);
    expect(metrics.pivots[name].parent).toBe(name.startsWith('ear') ? 'head' : 'root');
    if (rest) {
      expect(metrics.pivots[name].rotation).toEqual([0, 0, 0]);
      expect(metrics.pivots[name].scale).toEqual([1, 1, 1]);
    }
  }
}

async function frame(page, view, neutral = true) {
  return page.evaluate(({ view, neutral, rests }) => {
    const game = window.__game, root = game.worldState.pet.mesh, camera = game.camera;
    if (neutral) for (const name of Object.keys(rests)) {
      const pivot = root.getObjectByName(name);
      pivot.rotation.set(0, 0, 0); pivot.scale.set(1, 1, 1);
    }
    root.updateWorldMatrix(true, true);
    const position = camera.position.clone().fromArray(view.position), target = camera.position.clone().fromArray(view.target);
    if (view.local) { root.localToWorld(position); root.localToWorld(target); }
    camera.position.copy(position); camera.lookAt(target); camera.updateProjectionMatrix();
    game.reflections.update();
    game.composer.gradePass.uniforms.time.value = performance.now() / 1000;
    game.composer.render(0);
    return { ...view, worldPosition: camera.position.toArray(), worldTarget: target.toArray(), up: camera.up.toArray(), fov: camera.fov, near: camera.near, far: camera.far, aspect: camera.aspect, projection: camera.projectionMatrix.toArray() };
  }, { view, neutral, rests: RESTS });
}

function pixelDelta(first, second) {
  const a = PNG.sync.read(fs.readFileSync(first)), b = PNG.sync.read(fs.readFileSync(second));
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  let changed = 0, absolute = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let differs = false;
    for (let c = 0; c < 3; c++) { const delta = Math.abs(a.data[i + c] - b.data[i + c]); absolute += delta; differs ||= delta > 0; }
    if (differs) changed++;
  }
  return { pixels: a.width * a.height, changedPixels: changed, changedFraction: changed / (a.width * a.height), meanAbsoluteChannelDelta: absolute / (a.width * a.height * 3) };
}

test('records reproducible Lulú geometry, four room views, and production motion', async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(240000);
  const output = freshOutput(testInfo), runs = [];
  const sourceFiles = execFileSync('git', ['ls-files', '-z', '--', 'docs', 'package-lock.json'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter((file) => /\.(ts|js|html|json)$/.test(file));
  const sourceHashes = Object.fromEntries(sourceFiles.map((file) => [file, sha(fs.readFileSync(path.join(ROOT, file)))]));
  for (const file of ['tests/e2e/lulu-geometry-review.spec.cjs', 'tests/mini-schnauzer-geometry.test.js', 'tests/pet-animation.test.js']) sourceHashes[file] = sha(fs.readFileSync(path.join(ROOT, file)));
  for (const run of ['first', 'repeat']) {
    const directory = path.join(output, run); fs.mkdirSync(directory);
    const room = await openRoom(browser, baseURL);
    try {
      const initial = await measure(room.page); assertGeometry(initial, true);
      const entry = await enterRoom(room.page);
      const captures = [];
      for (const view of VIEWS) {
        const camera = await frame(room.page, view);
        const metrics = await measure(room.page); assertGeometry(metrics, true);
        const image = `${view.name}.png`;
        await room.page.screenshot({ path: path.join(directory, image) });
        captures.push({ camera, metrics, image, sha256: sha(fs.readFileSync(path.join(directory, image))) });
      }
      const renderer = await room.page.evaluate(() => {
        const game = window.__game, renderer = game.renderer, gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
        const lights = []; game.scene.traverse((node) => { if (node.isLight) lights.push({ type: node.type, color: node.color.getHex(), intensity: node.intensity, position: node.position.toArray(), castShadow: node.castShadow }); });
        return { gpu: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER), vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR), webgl: gl.getParameter(gl.VERSION), dpr: renderer.getPixelRatio(), toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, outputColorSpace: renderer.outputColorSpace, shadowMap: { enabled: renderer.shadowMap.enabled, type: renderer.shadowMap.type }, environmentIntensity: game.scene.environmentIntensity, fog: { color: game.scene.fog.color.getHex(), density: game.scene.fog.density }, lights, passes: game.composer.passes.map((pass) => ({ type: pass.constructor.name, enabled: pass.enabled, strength: pass.strength, radius: pass.radius, threshold: pass.threshold, kernelRadius: pass.kernelRadius })), grade: { time: game.composer.gradePass.uniforms.time.value, grain: game.composer.gradePass.uniforms.grainStrength.value, vignette: game.composer.gradePass.uniforms.vignetteStrength.value } };
      });
      expect(room.errors).toEqual([]);
      const manifest = { kind: 'static art: neutral rest pose; paused clock with 25 queued production RAF callbacks at 16ms; actual room and composer', browser: browser.version(), os: { platform: os.platform(), release: os.release(), arch: os.arch() }, three: JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'))).version, viewport: { width: 1440, height: 1000, dpr: 1 }, time: TIME, randomSeed: RANDOM_SEED, seed: SEED, sourceHashes, entry, externalModel: room.externalModel, resources: room.resources, renderer, captures };
      writeJSON(path.join(directory, 'capture-manifest.json'), manifest);
      writeJSON(path.join(directory, 'cost.json'), { cost: captures[0].metrics.cost, bounds: captures[0].metrics.bounds, pivots: captures[0].metrics.pivots, root: initial.root });
      runs.push(manifest);
      console.log(`Lulú ${run} images: ${directory}`);
    } finally { await room.context.close(); }
  }
  expect(runs[1].renderer).toEqual(runs[0].renderer);
  expect(runs[1].resources).toEqual(runs[0].resources);
  const repeatability = VIEWS.map((view, index) => {
    expect(runs[1].captures[index].metrics).toEqual(runs[0].captures[index].metrics);
    expect(runs[1].captures[index].camera).toEqual(runs[0].captures[index].camera);
    return { view: view.name, ...pixelDelta(path.join(output, 'first', `${view.name}.png`), path.join(output, 'repeat', `${view.name}.png`)) };
  });
  writeJSON(path.join(output, 'repeatability.json'), repeatability);
  for (const delta of repeatability) expect(delta.changedPixels, `${delta.view} deterministic pixels`).toBe(0);

  const room = await openRoom(browser, baseURL);
  try {
    const before = await measure(room.page), samples = [];
    const entry = await enterRoom(room.page);
    const phases = [
      { name: 'awake-far', hour: 14, forward: 3, side: 0, sleeping: false, excited: false },
      { name: 'tracking-left', hour: 14, forward: 0, side: 2, sleeping: false, excited: false },
      { name: 'tracking-right', hour: 14, forward: 0, side: -2, sleeping: false, excited: false },
      { name: 'sleeping-far', hour: 3, forward: 3, side: 0, sleeping: true, excited: false },
      { name: 'wake-near', hour: 3, forward: 1.2, side: 0, sleeping: false, excited: false },
      { name: 'excited', hour: 3, forward: 0.5, side: 0, sleeping: false, excited: true },
      { name: 'return-to-sleep', hour: 3, forward: 3, side: 0, sleeping: true, excited: false },
    ];
    for (const phase of phases) {
      await room.page.evaluate((phase) => {
        const game = window.__game, pet = game.worldState.pet.model, rotation = pet.bodyRotation;
        window.__TIME_OF_DAY_NOW__ = new Date(`2026-09-04T${String(phase.hour).padStart(2, '0')}:00:00-03:00`);
        game.camera.position.set(pet.position.x + Math.cos(rotation) * phase.forward - Math.sin(rotation) * phase.side, pet.position.y + 1, pet.position.z - Math.sin(rotation) * phase.forward - Math.cos(rotation) * phase.side);
        Object.assign(game.worldState.player.position, { x: game.camera.position.x, y: game.camera.position.y, z: game.camera.position.z });
      }, phase);
      await advanceFrames(room.page, 20);
      const metrics = await measure(room.page); assertGeometry(metrics);
      expect(metrics.model.sleeping).toBe(phase.sleeping); expect(metrics.model.excited).toBe(phase.excited);
      expect(metrics.pivots.head.rotation[0]).toBe(phase.sleeping ? -0.45 : 0);
      if (phase.name === 'tracking-left') expect(metrics.pivots.head.rotation[1]).toBeGreaterThan(0.4);
      if (phase.name === 'tracking-right') expect(metrics.pivots.head.rotation[1]).toBeLessThan(-0.4);
      for (const node of metrics.nodes.filter((node) => node.name !== 'nose')) {
        expect(node.parent).toBe('root'); expect(node.worldPosition).toEqual(before.nodes.find((original) => original.name === node.name).worldPosition);
      }
      expect(metrics.nodes.find((node) => node.name === 'nose').parent).toBe('head');
      expect(metrics.clock.gameFrameTime).toBeGreaterThan(samples.at(-1)?.metrics.clock.gameFrameTime ?? before.clock.gameFrameTime);
      const camera = await frame(room.page, VIEWS[0], false);
      const image = `live-${phase.name}.png`;
      await room.page.screenshot({ path: path.join(output, image) });
      samples.push({ phase, metrics, camera, image, sha256: sha(fs.readFileSync(path.join(output, image))) });
      writeJSON(path.join(output, `live-${phase.name}.json`), samples.at(-1));
      console.log(`Production motion sampled: ${phase.name}`);
    }
    writeJSON(path.join(output, 'live-motion.json'), { kind: 'production Game.animate -> AnimationSystem -> updatePet; queued real RAF callbacks at 16ms; no snapshot bypass or direct animator call', entry, externalModel: room.externalModel, initial: before, samples, resources: room.resources, errors: room.errors });
    expect(room.errors).toEqual([]);
  } finally { await room.context.close(); }
});
