import { resizeCanvas, createWebGLProgram, getRectFromElementRelative } from "@/src/util/canvas"

const contentEl = document.querySelector(".content") as HTMLDivElement;
const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;

function createRenderer(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  const vs = `#version 300 es
  in vec2 aPos;

  void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;
  // Shout out to XOR for noise and turbulence examples: https://www.shadertoy.com/view/XtXXD8.
  const fs = `#version 300 es
    precision highp float;
    out vec4 o;

    uniform vec2 uResolution;
    uniform vec2 uPos;
    uniform float uTime;
    uniform vec2 uMouse;

    float hash(vec2 n) {return fract(cos(dot(n,vec2(36.26,73.12)))*354.63);}
    float noise(vec2 n) {
      vec2 fn = floor(n), sn = smoothstep(vec2(0.0),vec2(1.0),fract(n));
      return mix(mix(hash(fn),hash(fn+vec2(1.0,0.0)),sn.x),mix(hash(fn+vec2(0.0,1.0)),hash(fn+vec2(1.0)),sn.x),sn.y);
    }
    float vnoise(vec2 n) {
      return noise(n/32.0)*0.5875+noise(n/16.0)*0.2+noise(n/8.0)*0.1+noise(n/4.0)*0.05+noise(n/2.0)*0.025+noise(n)*0.0125;
    }

    void main() {
      vec2 p=(gl_FragCoord.xy-uPos)/uResolution.y*2.;
      for (float i=.0;i<11.;i++){p.x+=sin(p.y+i+uTime*.02);p*=mat2(9.,-8.,.6,8.)/7.3;}
      float pat=smoothstep(.2,.6,vnoise(p*23.5+uTime*.005)*.25+.09);
      vec2 a=(gl_FragCoord.xy-uPos)/uResolution.y;
      vec2 b=(gl_FragCoord.xy-(uResolution-uPos))/uResolution.y;
      float m=abs(a.x)*abs(b.x)*abs(a.y)*abs(b.y)*90.+.001;
      float ma=.09/m*pat*smoothstep(-0.4,.0,a.x)*(1.-smoothstep(.0,1.1,a.x))*smoothstep(-0.7,0.0,a.y)*(1.-smoothstep(0.0,0.19,a.y));
      float mb=.09/m*pat*smoothstep(-1.1,.0,b.x)*(1.-smoothstep(.0,0.4,b.x))*smoothstep(-.19,.0,b.y)*(1.0-smoothstep(.0,.7,b.y));

      o = vec4(vec3(1., .85, .6) * ma + vec3(1., .85, .6) * mb, max(ma, mb));
    }
  `;

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
  const uMouse = gl.getUniformLocation(program, "uMouse");

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
    gl.uniform2f(uPos, x - 30, y + 10);
  }

  function mousemove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = 1 - (e.clientY - rect.top) / rect.height * 2;

    gl.useProgram(program);
    gl.uniform2f(uMouse, x, y);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", mousemove);
  resize();

  requestAnimationFrame(frame);
}

createRenderer(gl, canvas);
