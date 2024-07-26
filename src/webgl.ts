import { mat3, mat4 } from 'gl-matrix';
import { loadOBJFile } from '../helpers/loader';
import { loadTextResource } from '../helpers';
import ShaderProgram from '../helpers/shaderProgram';
import RenderableObject from '../helpers/renderableObject';
import { TextureCube } from '../helpers/cube';

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
  setupSettings();

  // Load shaders
  const sceneVertexShader = (await loadTextResource('/shaders/shader1.vert')) as string;
  const sceneFragmentShader = (await loadTextResource('/shaders/shader1.frag')) as string;
  const sceneShader = new ShaderProgram(gl, sceneVertexShader, sceneFragmentShader);
  shaders.push(sceneShader);

  const sunVertexShader = (await loadTextResource('/shaders/sun.vert')) as string;
  const sunFragmentShader = (await loadTextResource('/shaders/sun.frag')) as string;
  const sunShader = new ShaderProgram(gl, sunVertexShader, sunFragmentShader);
  shaders.push(sunShader);

  const moonVertexShader = (await loadTextResource('/shaders/moon.vert')) as string;
  const moonFragmentShader = (await loadTextResource('/shaders/moon.frag')) as string;
  const moonShader = new ShaderProgram(gl, moonVertexShader, moonFragmentShader);
  shaders.push(moonShader);

  // Load OBJ files and create objects
  const sceneOBJ = await loadOBJFile('objects/low-poly-house.obj');
  const scene = new RenderableObject(gl, sceneOBJ, sceneShader);
  objects.push(scene);

  const sun = new TextureCube(gl, sunShader, '/textures/sun.png');
  objects.push(sun);

  const moon = new TextureCube(gl, moonShader, '/textures/moon.png');
  objects.push(moon);

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

  const timeOfDay = ((time * speed) % 36000) / 36000;

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
let lightDistance = 80.0;
let speed = 0.1;

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
    targetZoom = Math.min(Math.max(0.1, targetZoom), 2.0);
  };
}

function setupSettings() {
  const lightDistanceElement = document.querySelector<HTMLInputElement>('#lightDistance');
  if (lightDistanceElement) {
    lightDistance = parseInt(lightDistanceElement.value);
    lightDistanceElement.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      lightDistance = parseInt(target.value);
      console.log(lightDistance);
    });
  }

  const speedElement = document.querySelector<HTMLInputElement>('#speed');
  if (speedElement) {
    speed = parseFloat(speedElement.value) / 10;
    speedElement.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      speed = parseFloat(target.value) / 10;
      console.log(speed);
    });
  }
}

function smoothScroll() {
  cameraZoom += (targetZoom - cameraZoom) * 0.1;
  requestAnimationFrame(smoothScroll);
}

smoothScroll();
