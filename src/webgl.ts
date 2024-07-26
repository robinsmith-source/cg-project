import { mat3, mat4 } from 'gl-matrix';
import { loadOBJFile } from '../helpers/loader';
import { loadTextResource } from '../helpers';
import ShaderProgram from '../helpers/shaderProgram';
import RenderableObject from '../helpers/renderableObject';

let gl: WebGL2RenderingContext;
let objects: RenderableObject[] = [];
let shaders: ShaderProgram[] = [];
const timeAtProgramStart = new Date().getTime();

export async function initialize(canvas: HTMLCanvasElement) {
  gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  if (!gl) {
    console.error('Your browser does not support WebGL2');
    return;
  }

  configureCanvas(canvas);
  setupCameraRotation(canvas);

  // Load shaders
  const sceneVertexShader = (await loadTextResource('/shaders/shader1.vert')) as string;
  const sceneFragmentShader = (await loadTextResource('/shaders/shader1.frag')) as string;
  const sceneShader = new ShaderProgram(gl, sceneVertexShader, sceneFragmentShader);
  shaders.push(sceneShader);

  // Load OBJ files and create objects
  const objData1 = await loadOBJFile('objects/low-poly-house.obj');
  const object1 = new RenderableObject(gl, objData1, sceneShader);
  objects.push(object1);

  renderLoop();
}

function configureCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1920;
  canvas.height = 1080;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
}

function renderLoop() {
  render();
  requestAnimationFrame(renderLoop);
}

function render() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const time = new Date().getTime() - timeAtProgramStart;
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0.0, -0.5, -45.0]);
  mat4.rotate(viewMatrix, viewMatrix, (-cameraRotation.x * Math.PI) / 180, [1, 0, 0]);
  mat4.rotate(viewMatrix, viewMatrix, (-cameraRotation.y * Math.PI) / 180, [0, 1, 0]);

  mat4.scale(viewMatrix, viewMatrix, [cameraZoom, cameraZoom, cameraZoom]);
  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (45 * Math.PI) / 180,
    gl.canvas.width / gl.canvas.height,
    0.1,
    100.0
  );
  const normalMatrix = mat3.create();
  mat3.fromMat4(normalMatrix, modelMatrix);
  mat3.invert(normalMatrix, normalMatrix);
  mat3.transpose(normalMatrix, normalMatrix);

  const timeOfDay = (time % 36000) / 36000;
  const lightDistance = 80.0; // Set the distance of the sun and moon

  objects.forEach((object) => {
    object.render(
      gl,
      modelMatrix,
      viewMatrix,
      projectionMatrix,
      normalMatrix,
      timeOfDay,
      lightDistance
    );
  });
}

let cameraRotation = { x: -15, y: -180 };
let cameraZoom = 1.0;
let targetZoom = 1.0;
let isMouseDown = false;

function setupCameraRotation(canvas: HTMLCanvasElement) {
  canvas.onmousedown = () => (isMouseDown = true);
  document.onmouseup = () => (isMouseDown = false);
  document.onmousemove = (event) => {
    if (isMouseDown) {
      cameraRotation.x = Math.min(Math.max(-90, cameraRotation.x + event.movementY * 0.2), 0);
      cameraRotation.y += event.movementX * 0.2;
    }
  };
  document.onwheel = (event) => {
    targetZoom += event.deltaY * -0.001;
    targetZoom = Math.min(Math.max(0.5, targetZoom), 2.0);
  };
}

function smoothScroll() {
  cameraZoom += (targetZoom - cameraZoom) * 0.1;
  requestAnimationFrame(smoothScroll);
}

smoothScroll();
