#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// input data from the vertex shader
in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;

// uniforms
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

	vec3 E_light = (pointLight.color * pointLight.intensity);
	float dist = length(pointLight.worldSpacePosition - worldSpacePosition);
	vec3 E = E_light / (dist * dist);

	vec3 E_a = ambientLight.color * ambientLight.intensity;

	vec3 k_a = material.color * material.ambientIntensity;
	// ambient illumination
	vec3 I_a = k_a;

	// convert normal to world space, normal vectors require a special matrix
	vec3 N = normalize(worldSpaceNormal);
	// calculate the direction from the current point on the surface to the light
	vec3 L = normalize( pointLight.worldSpacePosition - worldSpacePosition );
	// diffuse reflection coefficient
	vec3 k_d = material.color * material.diffuseIntensity;
	// diffuse illumination
	float nDotL = max( 0.0, dot(N, L) );
	vec3 I_d = k_d * nDotL;

	// specular lighting does not take the color of the material into account
	vec3 k_s = vec3(material.specularIntensity);
	// reflect a light ray along the surface normal
	vec3 R = reflect(-L, N);
	vec3 V = normalize( u_cameraWorldSpacePosition - worldSpacePosition );
	vec3 I_s_phong = k_s * pow( max( 0.0, dot(R, V) ), material.shininessConstant);

	// exercise 4.3 blinn phong reflection model
	vec3 H = normalize( V + L );
	vec3 I_s_blinn_phong = k_s * pow( max( 0.0, dot(N, H) ), material.shininessConstant);

	float nDotLPositive = float(nDotL > 0.0);
	vec3 I_s = I_s_blinn_phong * nDotLPositive; // the specular component is only included if n dot l is positive

	// lighting composition
	vec3 I_p = I_a * E_a + (I_d + I_s) * E;

	fragColor = vec4(0,0,0, 1);
	fragColor.xyz = I_p;
}
