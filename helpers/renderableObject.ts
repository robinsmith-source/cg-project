import {MaterialGroup} from "./loader";
import ShaderProgram from "./shaderProgram";
import {mat3, mat4} from "gl-matrix";


export default class RenderableObject {
    vao: WebGLVertexArrayObject;
    numVertices: number;
    shaderProgram: ShaderProgram;
    materialGroups: MaterialGroup[];
    materials: { [key: string]: any };

    constructor(gl: WebGL2RenderingContext, objData: any, shaderProgram: ShaderProgram) {
        this.shaderProgram = shaderProgram;
        this.materialGroups = objData.materialGroups;
        this.materials = objData.materials;

        const objPositions = new Float32Array(objData.positions);
        const objNormals = objData.normals ? new Float32Array(objData.normals) : new Float32Array([]);
        const objUVs = objData.uvs ? new Float32Array(objData.uvs) : new Float32Array([]);
        const objIndices = new Uint16Array(objData.indices);
        this.numVertices = objIndices.length;
        this.vao = this.setupGeometry(gl, objPositions, objNormals, objUVs, objIndices);
    }

    setupGeometry(gl: WebGL2RenderingContext, positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array) {
        const vao = gl.createVertexArray() as WebGLVertexArrayObject;
        gl.bindVertexArray(vao);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const positionAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Setup normal buffer if normals are available
        const normalAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_normal");
        if (normalAttributeLocation >= 0 && normals.length > 0) {
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        }

        const uvAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_uv");
        if (uvAttributeLocation >= 0) {
            const uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(uvAttributeLocation);
            gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        }

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return vao;
    }

    render(gl: WebGL2RenderingContext, modelMatrix: mat4, viewMatrix: mat4, projectionMatrix: mat4, normalMatrix: mat3, timeOfDay: number, lightDistance: number) {
        gl.useProgram(this.shaderProgram.program);
        gl.bindVertexArray(this.vao);

        const modelMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_modelMatrix");
        const viewMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_viewMatrix");
        const projectionMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_projectionMatrix");
        const normalLocalToWorldMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_normalLocalToWorldMatrix");
        const cameraWorldSpacePositionLocation = gl.getUniformLocation(this.shaderProgram.program, "u_cameraWorldSpacePosition");
        const timeOfDayLocation = gl.getUniformLocation(this.shaderProgram.program, "u_timeOfDay");
        const lightDistanceLocation = gl.getUniformLocation(this.shaderProgram.program, "u_lightDistance");

        // Uniform locations for material properties
        const materialShininessLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.Shininess");
        const materialAmbientColorLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.AmbientColor");
        const materialDiffuseColorLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.diffuseColor");
        const materialSpecularColorLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.SpecularColor");
        const materialEmissiveColorLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.EmissiveColor");
        const materialDensityLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.Density");
        const materialTransparencyLocation = gl.getUniformLocation(this.shaderProgram.program, "u_material.Transparency");

// Iterate over material groups and render each with the correct material settings
        this.materialGroups.forEach(group => {
            const material = this.materials[group.materialName];

            // Set material-specific uniforms
            gl.uniform1f(materialShininessLocation, material.shininess);
            gl.uniform3fv(materialAmbientColorLocation, material.ambientColor);
            gl.uniform3fv(materialDiffuseColorLocation, material.diffuseColor);
            gl.uniform3fv(materialSpecularColorLocation, material.specularColor);
            gl.uniform3fv(materialEmissiveColorLocation, material.emissiveColor);
            gl.uniform1f(materialDensityLocation, material.density);
            gl.uniform1f(materialTransparencyLocation, material.transparency);

            // Bind the index buffer for the current material group and draw
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(group.indices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, group.indices.length, gl.UNSIGNED_SHORT, 0);
        });

        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        gl.uniformMatrix3fv(normalLocalToWorldMatrixLocation, false, normalMatrix);
        gl.uniform3fv(cameraWorldSpacePositionLocation, [1.0, 1.0, 1.0]);
        gl.uniform1f(timeOfDayLocation, timeOfDay);
        gl.uniform1f(lightDistanceLocation, lightDistance);

        gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}