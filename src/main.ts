import './style.css';
import { initialize } from './webgl';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas"></canvas>
    <footer>
        <div id="credits">
          <span>Created by <a href="https://robinschmidt.dev"/>Robin Schmidt</a></span>
          <a href="https://github.com/robinsmith-source/cg-project">Source Code</a>
        </div>
        <div id="settings">
          <div>
            <label for="lightDistance">Light Distance</label>
            <input type="range" id="lightDistance" min="25" max="120" value="40" />
          </div>
          <div>
            <label for="speed">Speed</label>
            <input type="range" id="speed" min="0" max="200" value="20" />
          </div>
        </div>
    </footer>
  </div>
`;

initialize(document.querySelector<HTMLCanvasElement>('#canvas')!);
