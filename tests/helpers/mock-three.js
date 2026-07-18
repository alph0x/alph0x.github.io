/**
 * @fileoverview Shared three.js WebGLRenderer mock for DOM-environment tests.
 *
 * Usage (vi.mock is hoisted, so the factory must lazy-import this helper):
 *   vi.mock('three', async () => {
 *     const { mockThreeModule } = await import('./helpers/mock-three.js');
 *     return mockThreeModule(await vi.importActual('three'));
 *   });
 */
export function mockThreeModule(actual) {
  class FakeRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
      this.domElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      this.shadowMap = { enabled: false, type: null };
    }
    setSize() {}
    setPixelRatio() {}
    getPixelRatio() { return 1; }
    getSize(v) { return v.set(800, 600); }
    setRenderTarget() {}
    setClearColor() {}
    render() {}
    getContext() { return null; }
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
}
