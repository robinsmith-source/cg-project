import './style.css'
import {initialize} from './webgl'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas"></canvas>
    <footer>
        <p>Created by <a href="https://robinschmidt.dev"/>Robin Schmidt</a></p>
        <a href="https://github.com/robinsmith-source/cg-project">Source Code</a>
       
    </footer>
  </div>
`

initialize(document.querySelector<HTMLCanvasElement>('#canvas')!)