import {mat3, mat4, vec2} from "gl-matrix";
import {loadOBJFile, MaterialGroup} from "../helpers/loader.ts";
import {createProgram, createShader, loadTextResource} from "../helpers";

class ShaderProgram {
    program: WebGLProgram;
    gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
        this.gl = gl;
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource) as WebGLShader;
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource) as WebGLShader;
        this.program = createProgram(gl, vertexShader, fragmentShader) as WebGLProgram;
    }
}

class Object {
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

    render(gl: WebGL2RenderingContext, modelMatrix: mat4, viewMatrix: mat4, projectionMatrix: mat4, normalMatrix: mat3, time: number, resolution: vec2, mousePosition: vec2) {
        gl.useProgram(this.shaderProgram.program);
        gl.bindVertexArray(this.vao);

        const modelMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_modelMatrix");
        const viewMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_viewMatrix");
        const projectionMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_projectionMatrix");
        const normalLocalToWorldMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, "u_normalLocalToWorldMatrix");
        const cameraWorldSpacePositionLocation = gl.getUniformLocation(this.shaderProgram.program, "u_cameraWorldSpacePosition");
        const timeLocation = gl.getUniformLocation(this.shaderProgram.program, "u_time");
        const resolutionLocation = gl.getUniformLocation(this.shaderProgram.program, "u_resolution");
        const mousePositionLocation = gl.getUniformLocation(this.shaderProgram.program, "u_mouse");


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
        gl.uniform1f(timeLocation, time);
        gl.uniform2fv(resolutionLocation, resolution);
        gl.uniform2fv(mousePositionLocation, mousePosition);

        gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

let gl: WebGL2RenderingContext;
let objects: Object[] = [];
let shaders: ShaderProgram[] = [];
const timeAtProgramStart = new Date().getTime();

export async function initialize(canvas: HTMLCanvasElement) {
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
        console.error("Your browser does not support WebGL2");
        return;
    }

    configureCanvas(canvas);
    setupCameraRotation(canvas);

    // Load shaders
    const vertexShaderText1 = await loadTextResource("/shaders/shader1.vert") as string;
    const fragmentShaderText1 = await loadTextResource("/shaders/shader1.frag") as string;
    const shaderProgram1 = new ShaderProgram(gl, vertexShaderText1, fragmentShaderText1);
    shaders.push(shaderProgram1);

    const vertexShaderText2 = await loadTextResource("/shaders/shader2.vert") as string;
    const fragmentShaderText2 = await loadTextResource("/shaders/shader2.frag") as string;
    const shaderProgram2 = new ShaderProgram(gl, vertexShaderText2, fragmentShaderText2);
    shaders.push(shaderProgram2);

    // Load OBJ files and create objects
    const objData1 = await loadOBJFile('objects/car.obj');
    const object1 = new Object(gl, objData1, shaderProgram1);
    objects.push(object1);

    const objData2 = await loadOBJFile('objects/lamppost.obj');
    const object2 = new Object(gl, objData2, shaderProgram2);
    objects.push(object2);

    renderLoop();
}

function configureCanvas(canvas: HTMLCanvasElement) {
    canvas.width = 1920;
    canvas.height = 1080;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
}

function renderLoop() {
    render();
    requestAnimationFrame(renderLoop);
}

function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const time = new Date().getTime() - timeAtProgramStart;
    const resolution = vec2.fromValues(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    const modelMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, [0.0, 0.0, -8.0]);
    mat4.rotate(viewMatrix, viewMatrix, -cameraRotation.x * Math.PI / 180, [1, 0, 0]);
    mat4.rotate(viewMatrix, viewMatrix, -cameraRotation.y * Math.PI / 180, [0, 1, 0]);
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, modelMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);

    objects.forEach(object => {
        object.render(gl, modelMatrix, viewMatrix, projectionMatrix, normalMatrix, time, resolution, mousePosition);
    });
}

let cameraRotation = {x: 15, y: 30};
let mousePosition = vec2.create();
let isMouseDown = false;

function setupCameraRotation(canvas: HTMLCanvasElement) {
    canvas.onmousedown = () => isMouseDown = true;
    document.onmouseup = () => isMouseDown = false;
    document.onmousemove = (event) => {
        if (isMouseDown) {
            cameraRotation.x += event.movementY * 0.2;
            cameraRotation.y += event.movementX * 0.2;
        }
        vec2.set(mousePosition, event.pageX, window.innerHeight - event.pageY);
        vec2.scale(mousePosition, mousePosition, window.devicePixelRatio);
    };

    document.ontouchmove = (event) => {
        const touch = event.touches[0];
        if (touch) {
            vec2.set(mousePosition, touch.pageX, window.innerHeight - touch.pageY);
            vec2.scale(mousePosition, mousePosition, window.devicePixelRatio);
        }
        event.preventDefault();
    };
}