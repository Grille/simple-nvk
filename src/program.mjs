
import Engine from "./engine.mjs"


(function main() {
  let engine = new Engine();
  engine.startVulkan();
  (function drawLoop() {
    if (engine.window.shouldClose()) {
      engine.shutdownVulkan();
    }
    else {
      engine.drawFrame();
      engine.window.pollEvents();
      setTimeout(drawLoop, 5);
    }
  })();
})();

//console.log(nvk);