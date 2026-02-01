import '@/src/common.css'
import '@/src/style.css'
import { resizeCanvas, createWebGLProgram, getRectFromElementRelative } from "@/src/util/canvas"

const footerEl = document.querySelector(".footer-left") as HTMLDivElement;
footerEl.textContent = (footerEl.textContent as string).replace("2025-11-26T02:40:46.422Z", new Date().toISOString())

const contentEl = document.querySelector(".content") as HTMLDivElement;
const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;

function createRenderer(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  const vs = `#version 300 es
  in vec2 aPos;

  void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;
  const fs = `#version 300 es
    precision highp float;
    out vec4 fragColor;

    uniform vec2 uResolution;
    uniform vec2 uPos;
    uniform float uTime;

    float ccross(vec2 offsetPos, vec4 sideLimits) {
        vec2 p = (gl_FragCoord.xy - offsetPos) / uResolution.y * 2.0;

        for(float i = 0.0; i < 11.0; i++) {
            p.x += sin(p.y + i + uTime * 0.09);
            p *= mat2(6.0, -8.0, 5.0, 5.0) / 7.5;
        }

        float pattern = sin(p.x * 0.9 + p.y * 0.1 + uTime * 0.01) * 0.1 + 0.16;
        vec2 rel = (gl_FragCoord.xy - offsetPos) / uResolution.y;
        float blend = 0.2 / (abs(rel.y) * abs(rel.x) * 90.0 + 0.001);
        blend *= pattern;
        
        blend *= smoothstep(sideLimits.x, 0.0, rel.x);
        blend *= 1.0 - smoothstep(0.0, sideLimits.y, rel.x);
        blend *= smoothstep(sideLimits.z, 0.0, rel.y);
        blend *= 1.0 - smoothstep(0.0, sideLimits.w, rel.y);
        
        return blend;
    }

    void main() {
        vec2 oppositePos = uResolution - uPos;
        
        float blend1 = ccross(uPos, vec4(-0.4, 0.7, -0.7, 0.15));
        float blend2 = ccross(oppositePos, vec4(-0.7, 0.4, -0.15, 0.7));
        
        fragColor = vec4(vec3(max(blend1, blend2)), 1.0);
    }`;

  const vertices = new Float32Array([
    -1.0, -1.0,
    3.0, -1.0,
    -1.0, 3.0
  ]);

  const program = createWebGLProgram(gl, vs, fs);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPosLoc = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPosLoc);
  gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, "uTime");
  const uPos = gl.getUniformLocation(program, "uPos");
  const uRes = gl.getUniformLocation(program, 'uResolution');

  let startTime = performance.now();

  function frame() {
    const now = performance.now();
    const time = (now - startTime) * 0.001;

    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(frame);
  }

  function resize() {
    resizeCanvas(canvas, gl)
    const { x, y } = getRectFromElementRelative(contentEl, canvas);
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uPos, x - 50, y + 40);
  }

  window.addEventListener("resize", resize);
  resize();

  requestAnimationFrame(frame);
}

createRenderer(gl, canvas);
