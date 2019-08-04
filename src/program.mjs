import Vulkan from "./vulkan/vulkan.mjs";

(function main() {
  let engine = new Vulkan();
  let lastResize = 0;
  let fpsDate = Date.now();
  let fpsCount = 0;
  let title = "NVK Mandelbrot";
  engine.startWindow({ width: 480, height: 320, title });
  let window = engine.window;
  engine.startVulkan();
  (function drawLoop() {
    if (window.shouldClose()) {
      engine.shutdownVulkan();
    }
    else {
      engine.drawFrame();
      window.pollEvents();
      setTimeout(drawLoop, 0);
      if (lastResize !== 0 && Date.now() - lastResize > 100 && (window.width > 0 && window.height > 0)) {
        lastResize = 0;
        engine.startVulkan();
      }
      if (Date.now() - fpsDate > 1000){
        window.title = title + ` (${fpsCount})`;
        fpsDate = Date.now();
        fpsCount = 0;
      }
      fpsCount++;
    }
  })();
  window.onresize = () => {
    if (engine.vulkanReady)
      engine.shutdownVulkan();
    lastResize = Date.now();
  }
})();

//console.log(nvk);