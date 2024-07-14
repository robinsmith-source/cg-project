import './style.css'
import {initialize} from './webgl'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
   <header>
        <h1>WebGL2 - Car Toon Shading</h1>
          
</header>
    <canvas id="canvas"></canvas>
    <footer>
        <p>Created by <a href="https://robinschmidt.dev"/>Robin Schmidt</a></p>
</footer>
  </div>
`

initialize(document.querySelector<HTMLCanvasElement>('#canvas')!)