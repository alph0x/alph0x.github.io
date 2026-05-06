/**
 * @fileoverview Canvas 2D context mock for happy-dom.
 * Must be imported BEFORE any module that calls document.createElement('canvas').
 */

const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  fillRect: () => {},
  strokeRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fillText: () => {},
};

const mockWebGL = {
  canvas: {},
  drawingBufferWidth: 300,
  drawingBufferHeight: 150,
  getParameter: (p) => {
    if (p === 0x1F02) return 'WebGL 1.0';
    if (p === 0x1F00) return 'WebKit';
    if (p === 0x1F01) return 'WebKit WebGL';
    return 0;
  },
  getExtension: () => null,
  createShader: () => 1,
  shaderSource: () => {},
  compileShader: () => {},
  createProgram: () => 2,
  attachShader: () => {},
  linkProgram: () => {},
  useProgram: () => {},
  createBuffer: () => 3,
  bindBuffer: () => {},
  bufferData: () => {},
  getAttribLocation: () => 0,
  enableVertexAttribArray: () => {},
  vertexAttribPointer: () => {},
  getUniformLocation: () => 4,
  uniformMatrix4fv: () => {},
  uniform1f: () => {},
  uniform2f: () => {},
  uniform3f: () => {},
  uniform4f: () => {},
  uniform1i: () => {},
  createTexture: () => 5,
  bindTexture: () => {},
  texImage2D: () => {},
  texParameteri: () => {},
  viewport: () => {},
  clear: () => {},
  clearColor: () => {},
  enable: () => {},
  disable: () => {},
  blendFunc: () => {},
  drawArrays: () => {},
  drawElements: () => {},
  deleteShader: () => {},
  deleteProgram: () => {},
  deleteBuffer: () => {},
  deleteTexture: () => {},
  pixelStorei: () => {},
  activeTexture: () => {},
  depthFunc: () => {},
  cullFace: () => {},
  frontFace: () => {},
};

HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') return mockCtx;
  if (type === 'webgl' || type === 'webgl2') return mockWebGL;
  return null;
};
