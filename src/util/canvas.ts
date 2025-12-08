import { log } from "@/src/lib/log"

export function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  const w = canvas.clientWidth * window.devicePixelRatio;
  const h = canvas.clientHeight * window.devicePixelRatio;

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}

export function createWebGLProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vs);
  gl.compileShader(vertexShader);
  gl.attachShader(program, vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fs);
  gl.compileShader(fragmentShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    log("ERROR", `vertex: ${gl.getShaderInfoLog(vertexShader)}\n${vs}`)
    log("ERROR", `fragment: ${gl.getShaderInfoLog(fragmentShader)}\n${fs}`)
  }

  return program;
};

export function getRectFromElementRelative(element: HTMLElement, canvas: HTMLCanvasElement) {
  const elRect = element.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio;

  const x = (elRect.left - canvasRect.left) * dpr;
  const y = (canvasRect.bottom - elRect.top) * dpr;

  return { x, y };
}
