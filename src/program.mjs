
import Engine from "./engine.mjs"


(function main() {
  let engine = new Engine();
  let lastResize = 0;
  let fpsDate = Date.now();
  let fpsCount = 0;
  let title = "NVK Mandelbrot";
  engine.startWindow({ width: 480, height: 320, title });
  engine.startVulkan();
  (function drawLoop() {
    if (engine.window.shouldClose()) {
      engine.shutdownVulkan();
    }
    else {
      engine.drawFrame();
      engine.window.pollEvents();
      setTimeout(drawLoop, 0);
      if (lastResize !== 0 && Date.now() - lastResize > 100) {
        lastResize = 0;
        engine.startVulkan();
      }
      if (Date.now() - fpsDate > 1000){
        engine.window.title = title + ` (${fpsCount})`;
        fpsDate = Date.now();
        fpsCount = 0;
      }
      fpsCount++;
    }
  })();
  engine.window.onresize = () => {
    if (engine.vulkanReady)
      engine.shutdownVulkan();
    lastResize = Date.now();
  }
})();

//console.log(nvk);