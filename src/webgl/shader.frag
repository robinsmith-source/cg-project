#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec3 u_color;

in vec3 color;

out vec4 outColor;

void main() {
	outColor.xyz = color;
	outColor.w = 1.0;
}
