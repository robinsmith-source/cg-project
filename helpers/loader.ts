import {vec3} from "gl-matrix";

export type Material = {
    shininessConstant: number; // Ns
    ambientColor: vec3; // Ka
    diffuseColor: vec3; // Kd
    specularColor: vec3; // Ks
    emissiveColor: vec3; // Ke
    density: number; // Ni
    transparency: number; // d
}

export type ObjData = {
    positions: number[];
    normals: number[] | undefined;
    uvs: number[] | undefined;
    indices: number[];
    materials?: { [key: string]: Material }; // Material library
    materialLib?: string; // Material library file name
    materialGroups: MaterialGroup[]; // List of material groups
}

export type MaterialGroup = {
    materialName: string;
    indices: number[];
}

function parseOBJ(data: string): ObjData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    let materialLib: string | undefined;
    const materials: { [key: string]: Material } = {};
    const materialGroups: MaterialGroup[] = [];

    const vertexDataMap = new Map<string, number>();
    const finalPositions: number[] = [];
    const finalNormals: number[] = [];
    const finalUVs: number[] = [];
    const indices: number[] = [];

    let currentMaterial: string | undefined;
    const lines = data.split('\n');

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const type = parts.shift();

        switch (type) {
            case 'v':
                positions.push(...parts.map(parseFloat));
                break;
            case 'vn':
                normals.push(...parts.map(parseFloat));
                break;
            case 'vt':
                uvs.push(...parts.map(parseFloat));
                break;
            case 'f':
                const faceIndices: number[] = [];
                parts.forEach(part => {
                    const [posIndex, uvIndex, normIndex] = part.split('/').map(num => parseInt(num, 10) - 1);
                    const key = `${posIndex}|${uvIndex}|${normIndex}`;

                    if (!vertexDataMap.has(key)) {
                        vertexDataMap.set(key, finalPositions.length / 3);
                        finalPositions.push(positions[posIndex * 3], positions[posIndex * 3 + 1], positions[posIndex * 3 + 2]);
                        if (!isNaN(uvIndex)) {
                            finalUVs.push(uvs[uvIndex * 2], uvs[uvIndex * 2 + 1]);
                        }
                        if (!isNaN(normIndex)) {
                            finalNormals.push(normals[normIndex * 3], normals[normIndex * 3 + 1], normals[normIndex * 3 + 2]);
                        }
                    }
                    faceIndices.push(vertexDataMap.get(key)!);
                });
                indices.push(...faceIndices);

                if (currentMaterial) {
                    let materialGroup = materialGroups.find(group => group.materialName === currentMaterial);
                    if (!materialGroup) {
                        materialGroup = {materialName: currentMaterial, indices: []};
                        materialGroups.push(materialGroup);
                    }
                    materialGroup.indices.push(...faceIndices);
                }
                break;
            case 'mtllib':
                materialLib = parts.join(' ');
                break;
            case 'usemtl':
                currentMaterial = parts.join(' ');
                break;
            default:
                break;
        }
    });

    return {
        positions: finalPositions,
        normals: finalNormals.length > 0 ? finalNormals : undefined,
        uvs: finalUVs.length > 0 ? finalUVs : undefined,
        indices,
        materials,
        materialLib,
        materialGroups
    };
}


async function parseMTL(data: string): Promise<{ [key: string]: Material }> {
    const materials: { [key: string]: Material } = {};
    let currentMaterial: Partial<Material> = {};

    const lines = data.split('\n');

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const type = parts.shift();

        switch (type) {
            case 'newmtl':
                const materialName = parts.join(' ');
                currentMaterial = {};
                materials[materialName] = currentMaterial as Material;
                break;

            case 'Ns':
                if (currentMaterial) {
                    currentMaterial.shininessConstant = parseFloat(parts[0]);
                }
                break;
            case 'Ka':
                if (currentMaterial) {
                    currentMaterial.ambientColor = parts.map(parseFloat) as vec3;
                }
                break;
            case 'Kd':
                if (currentMaterial) {
                    currentMaterial.diffuseColor = parts.map(parseFloat) as vec3;
                }
                break;
            case 'Ks':
                if (currentMaterial) {
                    currentMaterial.specularColor = parts.map(parseFloat) as vec3;
                }
                break;
            case 'Ke':
                if (currentMaterial) {
                    currentMaterial.emissiveColor = parts.map(parseFloat) as vec3;
                }
                break;
            case 'Ni':
                if (currentMaterial) {
                    currentMaterial.density = parseFloat(parts[0]);
                }
                break;
            case 'd':
                if (currentMaterial) {
                    currentMaterial.transparency = parseFloat(parts[0]);
                }
                break;
            default:
                break;
        }
    });

    return materials;
}


export async function loadOBJFile(url: string): Promise<ObjData> {
    const response = await fetch(url);
    const data = await response.text();
    const objData = parseOBJ(data);

    // Check if there's an MTL file associated
    if (objData.materialLib) {
        const mtlUrl = `objects/${objData.materialLib}`; // Adjust path as per your project structure
        const mtlResponse = await fetch(mtlUrl);
        const mtlData = await mtlResponse.text();
        objData.materials = await parseMTL(mtlData);
    }

    console.log(objData);
    return objData;
}

