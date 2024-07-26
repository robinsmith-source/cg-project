import { mat3, mat4 } from 'gl-matrix';
import RenderableObject from './renderableObject';
import ShaderProgram from './shaderProgram';

export class TextureCube extends RenderableObject {
  texture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext, shaderProgram: ShaderProgram, texturePath: string) {
    super(
      gl,
      {
        positions: [
          // Front face
          -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
          // Back face
          -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
          // Top face
          -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
          // Bottom face
          -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
          // Right face
          1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
          // Left face
          -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
        ],
        normals: [],
        uvs: [
          // Front face
          0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
          // Back face
          1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
          // Top face
          0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
          // Bottom face
          1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
          // Right face
          1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
          // Left face
          0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ],
        indices: [
          // Front face
          0, 1, 2, 0, 2, 3,
          // Back face
          4, 5, 6, 4, 6, 7,
          // Top face
          8, 9, 10, 8, 10, 11,
          // Bottom face
          12, 13, 14, 12, 14, 15,
          // Right face
          16, 17, 18, 16, 18, 19,
          // Left face
          20, 21, 22, 20, 22, 23,
        ],
      },
      shaderProgram
    );

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

    mat4.scale(modelMatrix, modelMatrix, [2.0, 2.0, 2.0]);
    // Set the matrices
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalLocalToWorldMatrixLocation, false, normalMatrix);
    gl.uniform3fv(cameraWorldSpacePositionLocation, [1.0, 1.0, 1.0]);
    gl.uniform1f(timeOfDayLocation, timeOfDay);
    gl.uniform1f(lightDistanceLocation, lightDistance);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
    gl.useProgram(null);
  }
}
