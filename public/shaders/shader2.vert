#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

// uniform data, same value for every vertex -> "global data"
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalLocalToWorldMatrix;
uniform vec3 u_cameraWorldSpacePosition;

// output data that is sent to the fragment shader and will get interpolated
out vec3 worldSpaceNormal;
out vec3 worldSpacePosition;

void main() {
	worldSpacePosition = (u_modelMatrix * vec4(a_position, 1.0)).xyz;

	// a normal vector requires a speciaIllumination model more realistic than Phong, providing common material parameters and texture maps [medium]l matrix
	worldSpaceNormal = u_normalLocalToWorldMatrix * a_normal;

	// convert position from world space to clip space
	gl_Position = u_projectionMatrix * u_viewMatrix * vec4(vec3(worldSpacePosition.x - 1.0, worldSpacePosition.y,worldSpacePosition.z), 1.0);
}