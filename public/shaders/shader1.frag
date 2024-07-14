#version 300 es

precision highp float;

in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;
uniform vec3 u_cameraWorldSpacePosition;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;


out vec4 fragColor;

struct Material {
    vec3 color;
    float diffuseIntensity;
    float specularIntensity;
    float ambientIntensity;
    float shininessConstant;
};

struct PointLight {
    vec3 worldSpacePosition;
    vec3 color;
    float intensity;
};

struct AmbientLight {
    vec3 color;
    float intensity;
};

/*
 *  Calculates the diffuse factor produced by the light illumination
 */
float diffuseFactor(vec3 normal, vec3 light_direction) {
    float df = dot(normalize(normal), normalize(light_direction));

    if (gl_FrontFacing) {
        df = -df;
    }

    return max(0.0, df);
}

void main() {
    Material material;
    material.color = vec3(0.4, 0.7, 1.0);
    material.diffuseIntensity = 0.5;
    material.specularIntensity = 0.5;
    material.ambientIntensity = 1.0;
    material.shininessConstant = 100.0;

    PointLight pointLight;
    pointLight.worldSpacePosition = vec3(2.0, 3.0, 1.0); // Adjust position as needed
    pointLight.color = vec3(1.0, 1.0, 0.8);
    pointLight.intensity = 5.0; // Increased intensity


    // Use the mouse position to define the light direction
    float min_resolution = min(u_resolution.x, u_resolution.y);
    // Use the mouse position to define the light direction
    vec3 light_direction = -vec3((u_mouse - 0.5 * u_resolution) / min_resolution, 0.5);

    // Calculate the light diffusion factor
    float df = diffuseFactor(worldSpaceNormal, light_direction);

    // Define the toon shading steps
    float nSteps = 6.0;
    float step = sqrt(df) * nSteps;
    step = (floor(step) + smoothstep(0.48, 0.52, fract(step))) / nSteps;

    // Calculate the surface color based on the toon shading step
    vec3 surface_color = vec3(step * step);

    // Fragment shader output
    fragColor = vec4(surface_color * material.color , 1.0);
}