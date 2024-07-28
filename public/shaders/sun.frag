#version 300 es

precision highp float;

in vec2 v_uv;
in vec3 worldSpacePosition;
uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
  if (worldSpacePosition.y < -10.0) {
    discard;
  }
  fragColor = texture(u_texture, v_uv);
}
