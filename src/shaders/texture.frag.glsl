#version 300 es
precision mediump float;

in vec2 uv;
flat in int texIndex;

uniform sampler2D uSamplers[8];

out vec4 outColor;

void main() {
  if (texIndex == 0) outColor = texture(uSamplers[0], uv);
  if (texIndex == 1) outColor = texture(uSamplers[1], uv);
  if (texIndex == 2) outColor = texture(uSamplers[2], uv);
  if (texIndex == 3) outColor = texture(uSamplers[3], uv);
  if (texIndex == 4) outColor = texture(uSamplers[4], uv);
  if (texIndex == 5) outColor = texture(uSamplers[5], uv);
  if (texIndex == 6) outColor = texture(uSamplers[6], uv);
  if (texIndex == 7) outColor = texture(uSamplers[7], uv);
}
