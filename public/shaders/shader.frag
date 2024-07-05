#version 300 es

precision highp float;

in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;
uniform vec3 u_cameraWorldSpacePosition;
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

void main() {
    Material material;
    material.color = vec3(0.4, 0.7, 1.0);
    material.diffuseIntensity = 0.5;
    material.specularIntensity = 0.5;
    material.ambientIntensity = 1.0;
    material.shininessConstant = 100.0;

    PointLight pointLight;
    pointLight.worldSpacePosition = vec3(2.0, 3.0, 1.0);
    pointLight.color = vec3(1.0, 1.0, 0.8);
    pointLight.intensity = 10.0;

    AmbientLight ambientLight;
    ambientLight.color = vec3(0.4, 0.5, 0.6);
    ambientLight.intensity = 0.3;

    vec3 N = normalize(worldSpaceNormal);
    vec3 L = normalize(pointLight.worldSpacePosition - worldSpacePosition);
    vec3 V = normalize(u_cameraWorldSpacePosition - worldSpacePosition);
    vec3 R = reflect(-L, N);
    float dist = length(pointLight.worldSpacePosition - worldSpacePosition);
    vec3 lightColor = pointLight.color * pointLight.intensity / (dist * dist);

    // Toon shading adjustments
    float diffuse = max(dot(N, L), 0.0);
    float specular = pow(max(dot(R, V), 0.0), material.shininessConstant);

    // Quantize the diffuse and specular components
    float diffuseSteps = 3.0;
    float specularSteps = 2.0;
    diffuse = floor(diffuse * diffuseSteps) / diffuseSteps;
    specular = floor(specular * specularSteps) / specularSteps;

    vec3 ambient = ambientLight.color * ambientLight.intensity;
    vec3 color = ambient + (material.color * diffuse + vec3(specular)) * lightColor;

    fragColor = vec4(color, 1.0);
}