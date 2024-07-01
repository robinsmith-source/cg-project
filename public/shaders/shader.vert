#version 300 es

// attribute data
in vec3 a_position;
in vec4 a_color;

// data that gets interpolated and sent to the fragment shader
out vec3 color;

// uniform data, same value for every vertex
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

void main() {
	gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);

	color = a_color.xyz;
}
