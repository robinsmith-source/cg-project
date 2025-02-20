#version 300 es

precision highp float;

struct Material {
  float shininessConstant;
  vec3 diffuseColor;
  vec3 specularColor;
  vec3 ambientColor;
  vec3 emissiveColor;
  float density;
  float transparency;
};

struct DirectionalLight {
  vec3 direction;
  vec3 color;
  float intensity;
};

struct AmbientLight {
  vec3 color;
  float intensity;
};

in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;
uniform vec3 u_cameraWorldSpacePosition;
uniform float u_timeOfDay;
uniform float u_lightDistance;
uniform Material u_material;

const float PI = 3.14159;
out vec4 fragColor;

// Calculates the diffuse factor produced by the light illumination
float diffuseFactor(vec3 normal, vec3 light_direction) {
  float df = dot(normalize(normal), normalize(light_direction));
  return max(0.0, df);
}

// Calculate the direction of the sun based on the time of day and light distance
vec3 calculateSunDirection(float timeOfDay, float lightDistance) {
  float angle = timeOfDay * 2.0 * PI; // Full rotation over a day
  return normalize(vec3(0.0, sin(angle) * lightDistance * 2.0, cos(angle) * lightDistance * 2.0)); // Increase impact
}

// Calculate the direction of the moon based on the time of day and light distance
vec3 calculateMoonDirection(float timeOfDay, float lightDistance) {
  float angle = timeOfDay * 2.0 * PI + PI; // Full rotation over a day
  return normalize(vec3(0.0, sin(angle) * lightDistance * 2.0, cos(angle) * lightDistance * 2.0)); // Increase impact
}

// Interpolate between two colors based on the time of day using smoothstep
vec3 colorEase(vec3 startColor, vec3 endColor, float startTime, float endTime, float timeOfDay) {
  float t = (timeOfDay - startTime) / (endTime - startTime);
  t = smoothstep(0.0, 1.0, t); // Apply smoothstep for smoother transition
  return mix(startColor, endColor, t);
}

void main() {
  // Define sun and moon lights as directional lights
  DirectionalLight sunLight;
  sunLight.direction = calculateSunDirection(u_timeOfDay, u_lightDistance);
  sunLight.color = colorEase(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.4), 0.0, 0.5, u_timeOfDay);
  sunLight.intensity = 1.0;

  DirectionalLight moonLight;
  moonLight.direction = calculateMoonDirection(u_timeOfDay, u_lightDistance);
  moonLight.color = colorEase(vec3(0.3, 0.3, 0.4), vec3(0.1, 0.1, 0.2), 0.5, 1.0, u_timeOfDay);
  moonLight.intensity = 0.5;

  // Define ambient light
  AmbientLight ambientLight;
  ambientLight.color = vec3(0.1, 0.1, 0.1);
  ambientLight.intensity = 0.3;

  // Calculate the light diffusion factors
  float sunDf = diffuseFactor(worldSpaceNormal, sunLight.direction);
  float moonDf = diffuseFactor(worldSpaceNormal, moonLight.direction);

  // Define the toon shading steps
  float nSteps = 4.0;
  float sunStep = sqrt(sunDf) * nSteps;
  sunStep = (floor(sunStep) + smoothstep(0.48, 0.52, fract(sunStep))) / nSteps;

  float moonStep = sqrt(moonDf) * nSteps;
  moonStep = (floor(moonStep) + smoothstep(0.48, 0.52, fract(moonStep))) / nSteps;

  // Calculate the surface color based on the toon shading steps
  vec3 sunSurfaceColor = vec3(sunStep * sunStep) * sunLight.color * sunLight.intensity;
  vec3 moonSurfaceColor = vec3(moonStep * moonStep) * moonLight.color * moonLight.intensity;

  // Combine sun, moon, and ambient lighting
  vec3 surfaceColor =
    sunSurfaceColor + moonSurfaceColor + ambientLight.color * ambientLight.intensity;

  // Fragment shader output
  fragColor = vec4(surfaceColor * u_material.diffuseColor, u_material.transparency);
}
