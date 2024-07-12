export type ObjData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    materials?: { [key: string]: MaterialData }; // Material library
    materialLib?: string; // Material library file name
}

export type MaterialData = {
    diffuseColor?: number[]; // Example: [r, g, b]
    specularColor?: number[]; // Example: [r, g, b], for the specular highlight color
    ambientColor?: number[]; // Example: [r, g, b], for the ambient light color
    emissiveColor?: number[]; // Example: [r, g, b], for self-illumination
    shininess?: number; // Controls the shininess of the specular highlight
    opacity?: number; // Range from 0.0 (fully transparent) to 1.0 (fully opaque)
    textureMap?: string; // Path to the texture map image file
    normalMap?: string; // Path to the normal map image file
    specularMap?: string; // Path to the specular map image file
}

async function parseMTL(data: string): Promise<{ [key: string]: MaterialData }> {
    const materials: { [key: string]: MaterialData } = {};
    let currentMaterial: MaterialData | undefined;

    const lines = data.split('\n');

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const type = parts.shift();

        switch (type) {
            case 'newmtl':
                const materialName = parts.join(' ');
                currentMaterial = {};
                materials[materialName] = currentMaterial;
                break;
            case 'Kd':
                if (currentMaterial) {
                    currentMaterial.diffuseColor = parts.map(parseFloat);
                }
                break;
            case 'Ks':
                if (currentMaterial) {
                    currentMaterial.specularColor = parts.map(parseFloat);
                }
                break;
            case 'Ka':
                if (currentMaterial) {
                    currentMaterial.ambientColor = parts.map(parseFloat);
                }
                break;
            case 'Ke':
                if (currentMaterial) {
                    currentMaterial.emissiveColor = parts.map(parseFloat);
                }
                break;
            case 'Ns':
                if (currentMaterial) {
                    currentMaterial.shininess = parseFloat(parts[0]);
                }
                break;
            case 'd':
                if (currentMaterial) {
                    currentMaterial.opacity = parseFloat(parts[0]);
                }
                break;
            case 'map_Kd':
                if (currentMaterial) {
                    currentMaterial.textureMap = parts.join(' ');
                }
                break;
            case 'map_Bump':
                if (currentMaterial) {
                    currentMaterial.normalMap = parts.join(' ');
                }
                break;
            // Add more cases for other MTL properties as needed
            default:
                break;
        }
    });

    return materials;
}

function parseOBJ(data: string): ObjData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let materialLib: string | undefined;
    const materials: { [key: string]: MaterialData } = {};

    const lines = data.split('\n');

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const type = parts.shift();

        switch (type) {
            case 'v':
                // Vertex position
                positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
                break;
            case 'vn':
                // Vertex normal
                normals.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
                break;
            case 'vt':
                // Texture coordinates (UV)
                uvs.push(parseFloat(parts[0]), parseFloat(parts[1]));
                break;
            case 'f':
                if (parts.length < 3) {
                    console.warn('Face with fewer than 3 vertices encountered:', line);
                    break;
                }
                const firstVertex = parts[0].split('/');
                for (let i = 1; i < parts.length - 1; i++) {
                    const vertex1 = parts[i].split('/');
                    const vertex2 = parts[i + 1].split('/');

                    indices.push(parseInt(firstVertex[0]) - 1);
                    indices.push(parseInt(vertex1[0]) - 1);
                    indices.push(parseInt(vertex2[0]) - 1);
                }
                break;
            case 'mtllib':
                // Material library reference
                materialLib = parts.join(' ');
                break;
            default:
                break;
        }
    });

    return {positions, normals, uvs, indices, materials, materialLib};
}

export async function loadOBJFile(url: string): Promise<ObjData> {
    const response = await fetch(url);
    const data = await response.text();
    const objData = parseOBJ(data);

    // Check if there's an MTL file associated
    if (objData.materialLib) {
        const mtlUrl = `/objects/${objData.materialLib}`; // Adjust path as per your project structure
        const mtlResponse = await fetch(mtlUrl);
        const mtlData = await mtlResponse.text();
        objData.materials = await parseMTL(mtlData);
    }

    return objData;
}
