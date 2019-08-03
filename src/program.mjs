
import Engine from "./engine.mjs"


(function main() {
  let engine = new Engine();
  engine.startVulkan();
  engine.shutdownVulkan();

  (function drawLoop() {
    if (!engine.window.shouldClose()) setTimeout(drawLoop, 0);
    engine.window.pollEvents();
  })();
})();

//console.log(nvk);