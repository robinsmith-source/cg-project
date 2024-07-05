import './style.css'
import {initialize} from './webgl'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Vite + TypeScript</h1>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <canvas id="canvas"></canvas>
  </div>
`

initialize(document.querySelector<HTMLCanvasElement>('#canvas')!)