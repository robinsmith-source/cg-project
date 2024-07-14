#version 300 es

precision highp float;

in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;
uniform vec3 u_cameraWorldSpacePosition;


struct Material {
    float shininessConstant;
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 ambientColor;
    vec3 emissiveColor;
    float density;
    float transparency;
};
uniform Material u_material;

out vec4 fragColor;

void main() {
    vec3 norm = normalize(worldSpaceNormal);
    vec3 lightDir = normalize(vec3(5.0,2.0,0.0) - worldSpacePosition);
    vec3 viewDir = normalize(u_cameraWorldSpacePosition - worldSpacePosition);
    vec3 reflectDir = reflect(-lightDir, norm);
    vec3 lightColor = vec3(1.0,1.0,0.0);

    // Ambient
    vec3 ambient = 1.0 * u_material.ambientColor;

    // Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * u_material.diffuseColor * lightColor;

    // Specular
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.shininessConstant);
    vec3 specular = u_material.specularColor * spec *  lightColor;

    // Emissive
    vec3 emissive = u_material.emissiveColor;

    // Combine results
    vec3 result = ambient + diffuse + specular + emissive;
    fragColor = vec4(result, u_material.transparency);
}