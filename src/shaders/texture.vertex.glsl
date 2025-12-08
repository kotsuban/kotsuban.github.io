#version 300 es
precision mediump float;

layout(location = 0) in vec2 aUV;
layout(location = 1) in vec2 aSize;
layout(location = 2) in vec2 aPos;
layout(location = 3) in float aTexIndex;

uniform vec2 uRes;
in vec3 position;

out vec2 uv;
flat out int texIndex;

void main() {
  uv = aUV;
  texIndex = int(aTexIndex);

  // vec2 pixelPos = aUV * aSize + aPos;
  // vec2 ndc = (pixelPos / uRes) * 2.0 - 1.0;
  // gl_Position = vec4(ndc.x, ndc.y, 0.0, 1.0);
  vec2 zeroToOne = aPos / uRes;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
