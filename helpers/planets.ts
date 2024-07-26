import RenderableObject from './renderableObject';
import ShaderProgram from './shaderProgram';
import { ObjData } from './loader';

class Planet extends RenderableObject {
  constructor(gl: WebGL2RenderingContext, objData: ObjData, shaderProgram: ShaderProgram) {
    super(gl, objData, shaderProgram);
  }
}

export function createPlanet(
  gl: WebGL2RenderingContext,
  shaderProgram: ShaderProgram,
  config: {
    radius: number;
    latitudeBands: number;
    longitudeBands: number;
  } = { radius: 1, latitudeBands: 30, longitudeBands: 30 }
): Planet {
  const { radius, latitudeBands, longitudeBands } = config;
  const objData = generateSphere(radius, latitudeBands, longitudeBands);
  return new Planet(gl, objData, shaderProgram);
}

function generateSphere(radius: number, latitudeBands: number, longitudeBands: number): ObjData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
    const theta = (latNumber * Math.PI) / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      const phi = (longNumber * 2 * Math.PI) / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      const u = 1 - longNumber / longitudeBands;
      const v = 1 - latNumber / latitudeBands;

      normals.push(x, y, z);
      uvs.push(u, v);
      positions.push(radius * x, radius * y, radius * z);
    }
  }

  for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
      const first = latNumber * (longitudeBands + 1) + longNumber;
      const second = first + longitudeBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices,
    materialGroups: [
      {
        materialName: 'sphereMaterial',
        indices: indices,
      },
    ],
    materials: {
      sphereMaterial: {
        shininessConstant: 30,
        ambientColor: [0.5, 1.0, 0.5],
        diffuseColor: [0.0, 0.0, 1.0],
        specularColor: [0.0, 0.0, 1.0],
        emissiveColor: [0.0, 0.0, 0.0],
        density: 1.0,
        transparency: 1.0,
      },
    },
  };
}
