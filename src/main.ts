import './style.css';
import { initialize } from './webgl';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas"></canvas>
    <footer>
    <div id="credits">
    
        <p>Created by <a href="https://robinschmidt.dev"/>Robin Schmidt</a></p>
        <a href="https://github.com/robinsmith-source/cg-project">Source Code</a>
</div>
        <div id="settings">
          <label for="lightDistance">Light Distance</label>
          <input type="range" id="lightDistance" min="20" max="120" value="80" />  
                  
                  
                  <label for="speed">Speed</label>
          <input type="range" id="speed" min="0" max="200" value="20" />
          
          
 
<!--          <button id="toggleCycle">Toggle Cycle</button>-->
          
</div>
    </footer>
  </div>
`;

initialize(document.querySelector<HTMLCanvasElement>('#canvas')!);
