import * as THREE from 'three';

function buildWindow(cfg) {
  const group = new THREE.Group();
  const winW = 1.8, winH = 1.2;
  const winMat = new THREE.MeshStandardMaterial({ color: 0x88aacc });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
  win.position.set(...cfg.position); group.add(win);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1e });
  function makeBox(mat, size, pos) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.set(...pos);
    return mesh;
  }
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [cfg.position[0], cfg.position[1] + winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [cfg.position[0], cfg.position[1] - winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [cfg.position[0] - winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [cfg.position[0] + winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.03, 0.06], [cfg.position[0], cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.03, winH, 0.06], [cfg.position[0], cfg.position[1], cfg.position[2]]));
  return group;
}

function calculateMeshOpeningDims(mesh) {
  const clone = mesh.clone();
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);
  const box = new THREE.Box3();
  function visit(node) {
    if (node.userData?._parallax) return;
    if (node.isMesh && node.geometry) {
      box.expandByObject(node);
    }
    for (const child of node.children) {
      visit(child);
    }
  }
  visit(clone);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { width: size.x, height: size.y, bottomOffset: box.min.y };
}

const wrapper = new THREE.Group();
wrapper.position.set(0, 1.5, -1.85);
const frame = buildWindow({ position: [0, 0, 0] });
frame.position.set(0, 0, 0.16);
wrapper.add(frame);

const city = new THREE.Group();
city.userData._parallax = true;
city.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10)));
city.position.set(-0.015, -1.5, -8.0705);
wrapper.add(city);

const dims = calculateMeshOpeningDims(wrapper);
console.log('dims:', dims);
