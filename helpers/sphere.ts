import { mat3, mat4 } from 'gl-matrix';
import RenderableObject from './renderableObject';
import ShaderProgram from './shaderProgram';

export class TextureSphere extends RenderableObject {
  texture: WebGLTexture;

  constructor(
    gl: WebGL2RenderingContext,
    shaderProgram: ShaderProgram,
    texturePath: string,
    radius: number
  ) {
    const { positions, normals, uvs, indices } = createSphereGeometry(radius, 32, 32);
    super(gl, { positions, normals, uvs, indices }, shaderProgram);

    this.texture = this.loadTexture(gl, texturePath);
  }

  loadTexture(gl: WebGL2RenderingContext, path: string): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Load the image
    const image = new Image();
    image.src = path;
    image.onload = () => {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    return texture;
  }

  render(
    gl: WebGL2RenderingContext,
    modelMatrix: mat4,
    viewMatrix: mat4,
    projectionMatrix: mat4,
    normalMatrix: mat3,
    timeOfDay: number,
    lightDistance: number
  ) {
    gl.useProgram(this.shaderProgram.program);
    gl.bindVertexArray(this.vao);

    const modelMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_modelMatrix');
    const viewMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_viewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(
      this.shaderProgram.program,
      'u_projectionMatrix'
    );
    const normalLocalToWorldMatrixLocation = gl.getUniformLocation(
      this.shaderProgram.program,
      'u_normalLocalToWorldMatrix'
    );
    const cameraWorldSpacePositionLocation = gl.getUniformLocation(
      this.shaderProgram.program,
      'u_cameraWorldSpacePosition'
    );
    const timeOfDayLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_timeOfDay');
    const lightDistanceLocation = gl.getUniformLocation(
      this.shaderProgram.program,
      'u_lightDistance'
    );
    const textureLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_texture');

    // Set the texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(textureLocation, 0);

    // Set the matrices
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalLocalToWorldMatrixLocation, false, normalMatrix);
    gl.uniform3fv(cameraWorldSpacePositionLocation, [1.0, 1.0, 1.0]);
    gl.uniform1f(timeOfDayLocation, timeOfDay);
    gl.uniform1f(lightDistanceLocation, lightDistance);

    // Draw the sphere
    gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
    gl.useProgram(null);
  }
}

function createSphereGeometry(radius: number, latBands: number, longBands: number) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let latNumber = 0; latNumber <= latBands; latNumber++) {
    const theta = (latNumber * Math.PI) / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longBands; longNumber++) {
      const phi = (longNumber * 2 * Math.PI) / longBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      const u = 1 - longNumber / longBands;
      const v = 1 - latNumber / latBands;

      normals.push(x, y, z);
      uvs.push(u, v);
      positions.push(radius * x, radius * y, radius * z);
    }
  }

  for (let latNumber = 0; latNumber < latBands; latNumber++) {
    for (let longNumber = 0; longNumber < longBands; longNumber++) {
      const first = latNumber * (longBands + 1) + longNumber;
      const second = first + longBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return { positions, normals, uvs, indices };
}
