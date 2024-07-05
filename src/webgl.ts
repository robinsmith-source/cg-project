import {
    createProgram,
    createShader,
    loadTextResource,
    planeColors, planeIndices, planeNormals,
    planePositions, planeUVs,
    sphereColors,
    sphereIndices,
    sphereNormals,
    spherePositions,
    sphereUVs
} from "../helpers";
import {mat3, mat4} from "gl-matrix";

export async function initialize(canvas: HTMLCanvasElement) {
    // initialization
    await configurePipeline(canvas);
    sendAttributeDataToGPU();
    setupCameraRotation(canvas);
    renderLoop();
}

function renderLoop() {
    render();
    requestAnimationFrame(renderLoop);
}

let cameraRotation = {x: 15, y: 30};
let isMouseDown = false;

function setupCameraRotation(canvas: HTMLCanvasElement) {
    // set input callbacks
    // set isMouseDown to true if a mouse button is pressed while the cursor is on the canvas
    canvas.onmousedown = function () {
        isMouseDown = true
    };
    // set isMouseDown to false if the mouse button is released
    document.onmouseup = function () {
        isMouseDown = false
    };
    // update the camera rotation when the mouse is moved
    document.onmousemove = function (event) {
        if (isMouseDown) {
            cameraRotation.x += event.movementY * 0.2;
            cameraRotation.y += event.movementX * 0.2;
        }
    };
}

// this data is set in configurePipeline() and used in render()
let gl: WebGL2RenderingContext;
let program: WebGLProgram;

// VAOs contain vertex attribute calls and bind buffer calls
// Every object should have its own VAO
// Essentially it's a reference to the attribute data of an object
let vaoSphere: WebGLVertexArrayObject;
let vaoPlane: WebGLVertexArrayObject;

async function configurePipeline(canvas: HTMLCanvasElement) {
    // get WebGL2RenderingContext - everytime we talk to WebGL we use this object
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
        console.error("Your browser does not support WebGL2");
    }
    const enableAntialiasing = true;
    if (!enableAntialiasing) {
        canvas.style.imageRendering = "pixelated";
    }
    // set the resolution of the canvas html element
    canvas.width = 1920;
    canvas.height = 1080;
    // tell WebGL the resolution
    gl.viewport(0, 0, canvas.width, canvas.height);

    // enable depth testing with a z-buffer
    gl.enable(gl.DEPTH_TEST);

    // loadTextResource(), createShader() and createProgram() are defined in utils.js
    // loadTextResource returns a string that contains the content of a text file
    const vertexShaderText = await loadTextResource("/shaders/shader.vert") as string;
    const fragmentShaderText = await loadTextResource("/shaders/shader.frag") as string;
    // compile GLSL shaders - turn shader code into machine code that the GPU understands
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText) as WebGLShader;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText) as WebGLShader;
    // link the two shaders - create a program that uses both shaders
    program = createProgram(gl, vertexShader, fragmentShader) as WebGLProgram;
}

function sendAttributeDataToGPU() {
    vaoSphere = setupGeometry(spherePositions, sphereNormals, sphereColors, sphereUVs, sphereIndices) as WebGLVertexArrayObject;
    vaoPlane = setupGeometry(planePositions, planeNormals, planeColors, planeUVs, planeIndices) as WebGLVertexArrayObject;
}

function render() {
    // Clear the canvas with a single color
    //            r  g  b  a
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (consists of vertex shader and fragment shader)
    gl.useProgram(program);

    // if we would have multiple objects, we would do this for every one of them
    setMatrices(-cameraRotation.x, -cameraRotation.y); // set model, view and projection matrices
    renderObject(vaoPlane, planeIndices.length);
    renderObject(vaoSphere, sphereIndices.length);

    // unbind vao and program to avoid accidental modification
    gl.bindVertexArray(null);
    gl.useProgram(null);
}

function setMatrices(xRotationDegreesCamera: number, yRotationDegreesCamera: number) {
    // convert rotations from degree to radians
    const xRotationRadiansCamera = xRotationDegreesCamera / 360 * 2 * Math.PI;
    const yRotationRadiansCamera = yRotationDegreesCamera / 360 * 2 * Math.PI;

    // we use the math library glMatrix. Link to documentation: https://glmatrix.net/docs/

    // create a 4x4 Identity Matrix
    let modelMatrix = mat4.create();

    // functions from glMatrix have a little weird API: They often take an output and an input matrix
    // the input matrix is the input data and the output matrix is the matrix that the result will be written to

    let viewMatrix = mat4.create(); // create 4x4 identity matrix
    // the view matrix contains the translation (position) and rotation of the camera
    mat4.translate(
        viewMatrix, // output matrix
        viewMatrix, // matrix to translate
        [0.0, 0.0, -5.0], // amount to translate -> camera distance to the object
    );
    mat4.rotate(
        viewMatrix, // output matrix
        viewMatrix, // matrix to rotate
        -xRotationRadiansCamera, // amount to rotate in radians
        [1, 0, 0], // axis to rotate around
    );
    mat4.rotate(
        viewMatrix, // output matrix
        viewMatrix, // matrix to rotate
        -yRotationRadiansCamera, // amount to rotate in radians
        [0, 1, 0], // axis to rotate around
    );

    let projectionMatrix = mat4.create(); // create identity matrix
    const fieldOfView = 45 / 360 * 2 * Math.PI; // angle to radians
    const aspectRatio = gl.canvas.width / gl.canvas.height;
    const nearClippingPlane = 0.1;
    const farClippingPlane = 100.0;
    mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, nearClippingPlane, farClippingPlane);

    // the normalLocalToWorldMatrix is a special matrix for converting the normal direction to world space
    // usually to transform a direction you would do: modelMatrix * vec4(direction, 0.0); where direction is a vec3
    // the normal direction is special, because this does not work if the object has a non-uniform scaling
    // normalLocalToWorldMatrix = transpose(inverse(mat3(modelMatrix)))
    let normalLocalToWorldMatrix = mat3.create();
    mat3.fromMat4(
        normalLocalToWorldMatrix, // output mat3
        modelMatrix, // input mat4
    );
    mat3.invert(
        normalLocalToWorldMatrix, // output matrix
        normalLocalToWorldMatrix, // input matrix
    );
    mat3.transpose(
        normalLocalToWorldMatrix, // output matrix
        normalLocalToWorldMatrix, // input matrix
    );

    const modelMatrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
    const viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix");
    const projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");
    const normalLocalToWorldMatrixLocation = gl.getUniformLocation(program, "u_normalLocalToWorldMatrix");
	const cameraWorldSpacePositionLocation = gl.getUniformLocation(program, "u_cameraWorldSpacePosition");

    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalLocalToWorldMatrixLocation, false, normalLocalToWorldMatrix);
    gl.uniform3fv(cameraWorldSpacePositionLocation, [1.0, 1.0, 1.0]);
}

function renderObject(vao: WebGLVertexArrayObject, numVertices: number) {
    // Specify which attribute data we use by binding the vertex array object.
    // This executes all vertex attribute calls and bind buffer calls we made when initializing
    gl.bindVertexArray(vao);

    const primitiveType = gl.TRIANGLES; // some other primitive types are POINTS, LINES, TRIANGLE_STRIP, TRIANGLE_FAN
    const first = 0;
    const indexType = gl.UNSIGNED_SHORT; // UNSIGNED_SHORT equals a 16 bit unsigned int (Uint16Array)
    gl.drawElements(primitiveType, numVertices, indexType, first);
}

function setupGeometry(positions: number[], normals: number[], colors: number[], uvs: number[], indices: number[]) {
     // create a vertex array object (vao)
    // any subsequent vertex attribute calls and bind buffer calls will be stored inside the vao
    // affected functions: "enableVertexAttribArray" "vertexAttribPointer" "bindBuffer"
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    // make it the one we're currently working with
    gl.bindVertexArray(vao);

     // create a buffer on the GPU - a buffer is just a place in memory where we can put our data
    const positionBuffer = gl.createBuffer();

    // tell WebGL that we now want to use the positionsBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Put our data into the buffer we created on the GPU
    // Float32Array arranges the data in a way the GPU can understand
    // with STATIC_DRAW we tell WebGPU that we are not often going to update the data,
    // which allows for optimizations
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // this function searches for a variable called "a_position" in the vertex shader code
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of the positionBuffer
    const size = 3;          // one position has 3 components (vec3)
    const type = gl.FLOAT;   // our data is in 32bit floats (Float32Array)
    const normalize = false; // this parameter is only important for integer data
    // stride and offset tell WebGL about the memory layout
    const stride = 0;        // 0 will automatically set the correct stride
                             // manual stride calculation: size * sizeof(float): 2 * 4 Bytes = 8 Bytes
    const offset = 0;        // for our memory layout (one buffer per attribute), this can always set to 0
                             // this is only important, if you create a buffer that contains multiple attributes
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    const normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
    // optional attribute -> only set, if it is used in the shader
    if (normalAttributeLocation >= 0) {
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }

    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    // optional attribute -> only set, if it is used in the shader
    if (colorAttributeLocation >= 0) {
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    }

    const uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    // optional attribute -> only set, if it is used in the shader
    if (uvAttributeLocation >= 0) {
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(uvAttributeLocation);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    }

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // Uint16Array arranges the index data in a way the GPU can understand
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // unbind vao and buffers to avoid accidental modification
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
}