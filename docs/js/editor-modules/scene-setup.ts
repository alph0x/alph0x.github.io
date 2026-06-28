/**
 * @fileoverview Scene graph setup for the Room Layout Editor.
 * Creates lights, floor plane, and named groups. Pure infrastructure — no business logic.
 */

import * as THREE from 'three';

interface SetupResult {
  floorPlane: THREE.Mesh;
  roomGroup: THREE.Group;
  spawnGroup: THREE.Group;
  outlineGroup: THREE.Group;
  decorGroup: THREE.Group;
}

export class EditorSceneSetup {
  private readonly _scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this._scene = scene;
  }

  setup(): SetupResult {
    this._addLights();
    const floorPlane = this._createFloorPlane();
    const groups = this._createGroups();
    return { floorPlane, ...groups };
  }

  createGuideGroup(): THREE.Group {
    const guideGroup = new THREE.Group();
    this._scene.add(guideGroup);

    const mat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.25,
    });
    const vGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, -50),
      new THREE.Vector3(0, 0.01, 50),
    ]);
    const hGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-50, 0.01, 0),
      new THREE.Vector3(50, 0.01, 0),
    ]);
    guideGroup.add(new THREE.Line(vGeo, mat));
    guideGroup.add(new THREE.Line(hGeo, mat));
    guideGroup.visible = false;

    return guideGroup;
  }

  private _addLights(): void {
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 10, 5);
    this._scene.add(dir);
  }

  private _createFloorPlane(): THREE.Mesh {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);
    return plane;
  }

  private _createGroups(): Omit<SetupResult, 'floorPlane'> {
    const roomGroup = new THREE.Group();
    const spawnGroup = new THREE.Group();
    const outlineGroup = new THREE.Group();
    const decorGroup = new THREE.Group();

    this._scene.add(roomGroup);
    this._scene.add(spawnGroup);
    this._scene.add(outlineGroup);
    this._scene.add(decorGroup);

    return { roomGroup, spawnGroup, outlineGroup, decorGroup };
  }
}
