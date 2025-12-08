import { log } from "@/lib/log"

import { getRectFromElement } from '@/util/dom2canvas'
import textureFragShader from "@/shaders/texture.frag.glsl?raw"
import textureVertexShader from "@/shaders/texture.vertex.glsl?raw"
import type { CanvasElement } from "@/util/dom2canvas";

const TEXTURE_STRIDE = 5

abstract class Gpu {
  protected canvas: HTMLCanvasElement;

  protected constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  abstract init(): void;
  abstract render(): void;
  abstract add(i: number, source: CanvasElement): void;
  abstract clear(): void;
  abstract mouse(x: number, y: number): void;
  abstract resize(elements: HTMLElement[]): void;

  public async isWebGpuSupported() {
    const adapter = await navigator.gpu?.requestAdapter({
      featureLevel: 'compatibility',
    });
    const device = await adapter?.requestDevice();

    if (!device) {
      log("ERROR", "Unable to get a device for an unknown reason")
      return false
    }

    device.lost.then((reason) => {
      log("ERROR", `Device lost ("${reason.reason}"):\n${reason.message}`);
    });
    device.addEventListener('uncapturederror', (ev) => {
      log("ERROR", `Uncaptured error:\n${ev.error.message}`);
    });

    return true
  }
}

class WebGl extends Gpu {
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private buff: number[] = [];
  private textureBufferData!: Float32Array<ArrayBuffer>;
  private textureBuffer!: WebGLBuffer;
  private uRes!: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  add(i: number, { canvas, x, y }: CanvasElement) {
    const texture = this.gl.createTexture()!;

    this.gl.activeTexture(this.gl.TEXTURE0 + i);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      canvas
    );
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.buff.push(
      canvas.width, canvas.height, x, y, i
    )
  }

  init() {
    this.gl = this.canvas.getContext("webgl2", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: true,
      desynchronized: true,
    }) as WebGL2RenderingContext;

    const vertex = this.compileShader(textureVertexShader, this.gl.VERTEX_SHADER)
    const fragment = this.compileShader(textureFragShader, this.gl.FRAGMENT_SHADER)
    if (!vertex || !fragment) return
    const program = this.createProgram(vertex, fragment);
    if (!program) return

    this.program = program

    const vertexBuffer = this.gl.createBuffer();
    const vertexBufferData = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
    ]);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexBufferData, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribDivisor(0, 0);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.textureBuffer = this.gl.createBuffer();
    this.uRes = this.gl.getUniformLocation(this.program, "uRes")!;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private frame = () => {
    this.gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);

    this.textureBufferData = new Float32Array(this.buff);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureBufferData, this.gl.DYNAMIC_DRAW);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 0);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribDivisor(1, 1);
    this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 20, 8);
    this.gl.enableVertexAttribArray(2);
    this.gl.vertexAttribDivisor(2, 1);
    this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, 20, 16);
    this.gl.enableVertexAttribArray(3);
    this.gl.vertexAttribDivisor(3, 1);

    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, this.buff.length / TEXTURE_STRIDE);

    requestAnimationFrame(this.frame)
  }

  render() {
    const texLen = this.buff.length / TEXTURE_STRIDE
    this.gl.useProgram(this.program);
    this.gl.uniform1iv(this.gl.getUniformLocation(this.program, "uSamplers"), new Int32Array([...Array(texLen).keys()]));

    this.frame()
  }

  compileShader(source: string, type: number) {
    const shader = this.gl.createShader(type)!;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!success) {
      const error = this.gl.getShaderInfoLog(shader)!;
      log("ERROR", error)
    }

    return shader;
  }

  createProgram(vertex: WebGLShader, fragment: WebGLShader) {
    const program = this.gl.createProgram();

    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);

    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    return success ? program : null;
  };

  clear(): void {
    log("ERROR", "WebGl.clear() Not implemented")
  }

  resize(elements: HTMLElement[]): void {
    for (let i = 0; i < 1; i++) {
      const { width, height, x, y } = getRectFromElement(elements[i])
      const offset = i * TEXTURE_STRIDE;

      this.buff[offset] = width;
      this.buff[offset + 1] = height;
      this.buff[offset + 2] = x;
      this.buff[offset + 3] = y;
    }

    const w = this.canvas.clientWidth * window.devicePixelRatio
    const h = this.canvas.clientHeight * window.devicePixelRatio
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform2f(this.uRes, w, h);
  }

  mouse() {
    log("ERROR", "WebGl.mouse() Not implemented")
  }
}

export function getGpu(canvas: HTMLCanvasElement): Gpu {
  const gpu = new WebGl(canvas);

  return gpu;
}

// TODO
// Add bloom efect.
// Add glint effect.
// Fix any performance / lighthouse issues.
// Release the website.
// Add a visual effect at the right side of the screen.
// Setup blog system. -- The interesting idea (add shader effect to the post title, for example radiance cascades if this is the theme of the post, by default we should show our default glow + glint effect)
// Handle Macos snapping.
// Post idea: View images in nvim, show the simplest way to see the image, eg open current image preview in a new split, and show more convinient approach (replace bytecode from png with image preview using viu), not sure how to handle svg (we can show them by default as images, but add ability to see the bytecode)
// Post idea: How to setup make command in nvim without plugins.
// Post idea: Advanced fuzzy finder mechanism in nvim without plugins.
//
