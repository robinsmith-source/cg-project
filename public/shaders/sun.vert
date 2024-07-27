#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalLocalToWorldMatrix;
uniform float u_timeOfDay;
uniform float u_lightDistance;
const float PI = 3.14159;

out vec3 worldSpaceNormal;
out vec3 worldSpacePosition;
out vec2 v_uv;

// Calculate the position of the sun based on the time of day and distance
vec3 calculateSunPosition(float timeOfDay, float distance) {
  float angle = timeOfDay * 2.0 * PI - PI / 4.0; // Adjust sun position timing
  return vec3(cos(angle) * distance, sin(angle) * distance, 0.0);
}

void main() {
  v_uv = a_uv;
  vec3 sunPosition = calculateSunPosition(u_timeOfDay, u_lightDistance); // Calculate the sun's position
  vec3 transformedPosition = a_position + sunPosition; // Apply sun positions to the object's position
  worldSpacePosition = (u_modelMatrix * vec4(transformedPosition, 1.0)).xyz;
  worldSpaceNormal = u_normalLocalToWorldMatrix * a_normal;
  gl_Position = u_projectionMatrix * u_viewMatrix * vec4(worldSpacePosition, 1.0);
}
