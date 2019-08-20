import Vulkan from "./vulkan/vulkan.mjs";

let lastResize = 0;
let fpsDate = Date.now();
let fpsCount = 0;
let snvk = null;
let window = null;
let title = "NVK Mandelbrot";

let vertexPos = new Float32Array([
  -0.5, -0.5,
  0.5, 0.5,
  -0.5, 0.5,
  0.5, -0.5,
])
let vertexColor = new Float32Array([
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
  1, 1, 0,
])
let index = new Uint32Array([
  0, 1, 2,
  0, 3, 1,
])

/*main*/{
  snvk = new Vulkan();
  snvk.startWindow({ width: 480, height: 320, title });
  window = snvk.window;
  snvk.startVulkan();
  createInput();
  snvk.startPipeline();
  eventLoop();
  window.onresize = () => {
    if (snvk.vulkanReady){
      snvk.shutdownPipeline();
      //engine.shutdownVulkan();
    }
    lastResize = Date.now();
  }
}

function createInput() {
  let vertSrc = snvk.loadShaderSrc(`./src/shader/shader.vert`);
  let fragSrc = snvk.loadShaderSrc(`./src/shader/shader.frag`);

  let vertShader = snvk.createShader(vertSrc, snvk.SHADER_SRC_GLSL, snvk.SHADER_STAGE_VERTEX);
  snvk.bindShader(vertShader);

  let fragShader = snvk.createShader(fragSrc, snvk.SHADER_SRC_GLSL, snvk.SHADER_STAGE_FRAGMENT);
  snvk.bindShader(fragShader);

  let indexBufferCreateInfo = {
    type: snvk.TYPE_UINT32,
    size: 3,
    length: 2,
    usage: snvk.BUFFER_USAGE_INDEX,
  }
  let storageBufferCreateInfo = {
    type: snvk.TYPE_UINT32,
    size: 3,
    length: 2,
    usage: snvk.BUFFER_USAGE_STORAGE,
    readable: true,
  }
  let posBufferCreateInfo = {
    type: snvk.TYPE_FLOAT32,
    size: 2,
    length: 6,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }
  let colorBufferCreateInfo = {
    type: snvk.TYPE_FLOAT32,
    size: 3,
    length: 6,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }

  let storageBuffer = snvk.createBuffer(storageBufferCreateInfo);
  snvk.bufferSubData(storageBuffer, 0, index, 0, 2);
  //snvk.bindBuffer(storageBuffer);

  let indexBuffer = snvk.createBuffer(indexBufferCreateInfo);
  snvk.copyBuffer(storageBuffer, indexBuffer, 0, 2 * 4 * 3);
  //snvk.bufferSubData(indexBuffer, 0, index, 0, 2);
  snvk.bindBuffer(indexBuffer);

  let posBuffer = snvk.createBuffer(posBufferCreateInfo);
  snvk.bufferSubData(posBuffer, 0, vertexPos, 0, 6);
  snvk.bindBuffer(posBuffer, 0);

  let colorBuffer = snvk.createBuffer(colorBufferCreateInfo);
  snvk.bufferSubData(colorBuffer, 0, vertexColor, 0, 6);
  snvk.bindBuffer(colorBuffer, 1);

  //let cmdBuffer = snvk.createCmdBuffer();
  snvk.drawArray
}

function eventLoop() {
  if (window.shouldClose()) {
    snvk.shutdownPipeline();
    snvk.shutdownVulkan();
  }
  else {
    snvk.drawFrame();
    window.pollEvents();
    setTimeout(eventLoop, 0);
    if (lastResize !== 0 && Date.now() - lastResize > 100 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
      //engine.startVulkan();
      snvk.startPipeline();
    }
    if (Date.now() - fpsDate > 1000){
      window.title = title + ` (${fpsCount})`;
      fpsDate = Date.now();
      fpsCount = 0;
    }
    fpsCount++;
  }
}
/*
startVulkan

createShader
createBuffer

createCmdBuffer

loop{
executeCmdBuffer
}

shutdownVulkan

*/
//console.log(nvk);