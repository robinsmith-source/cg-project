#version 300 es

precision highp float;

in vec3 a_position;
in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position =
    u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position + vec3(a_position), 1.0);
}
