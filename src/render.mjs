import Vulkan from "./vulkan/vulkan.mjs";
import fs from "fs";

let lastResize = 0;
let fpsDate = Date.now();
let fpsCount = 0;
let snvk = null;
let window = null;
let title = "sNVK example";

let posData = new Float32Array([
  -0.5, -0.5,
  0.5, 0.5,
  -0.5, 0.5,
  0.5, -0.5,
])
let colorData = new Float32Array([
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
  1, 1, 0,
])
let indexData = new Uint32Array([
  0, 1, 2,
  0, 3, 1,
])

export function main(){
  snvk = new Vulkan();
  snvk.startWindow({ width: 480, height: 320, title });
  window = snvk.window;
  snvk.startVulkan();
  createInput();
  //snvk.startPipeline();
  eventLoop();
  /*
  window.onresize = () => {
    if (snvk.vulkanReady){
      snvk.shutdownPipeline();
      //engine.shutdownVulkan();
    }
    lastResize = Date.now();
  }
  */
}

function createInput() {
  let vertSrc = snvk.loadShaderSrc(`./src/shader/shader.vert`);
  let fragSrc = snvk.loadShaderSrc(`./src/shader/shader.frag`);

  //snvk.bindShader(compShader);

  let vertShader = snvk.createShader(vertSrc, snvk.SHADER_SRC_GLSL, snvk.SHADER_STAGE_VERTEX);
  //snvk.bindShader(vertShader);
  let fragShader = snvk.createShader(fragSrc, snvk.SHADER_SRC_GLSL, snvk.SHADER_STAGE_FRAGMENT);
  //snvk.bindShader(fragShader);

  let indexBufferCreateInfo = {
    type: snvk.TYPE_UINT32,
    size: 3,
    length: 2,
    usage: snvk.BUFFER_USAGE_INDEX,
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

  let indexBuffer = snvk.createBuffer(indexBufferCreateInfo);
  let indexBinding = snvk.getBinding(indexBuffer);
  snvk.bufferSubData(indexBuffer, 0, indexData, 0, 2);
  //snvk.bindBuffer(indexBuffer);

  let posBuffer = snvk.createBuffer(posBufferCreateInfo);
  let posAttrib = snvk.getAttribute(posBuffer, 0, snvk.TYPE_FLOAT32, 2);
  snvk.bufferSubData(posBuffer, 0, posData, 0, 6);
  //snvk.bindBuffer(posBuffer, 0);

  let colorBuffer = snvk.createBuffer(colorBufferCreateInfo);
  let colorAttrib = snvk.getAttribute(colorBuffer, 1, snvk.TYPE_FLOAT32, 3);
  snvk.bufferSubData(colorBuffer, 0, colorData, 0, 6);
  //snvk.bindBuffer(colorBuffer, 1);

  let surface = snvk.getSurface();

  let swapchainCreateInfo = {
    width: window.width,
    height: window.height,
    surface: surface,
  }
  let swapchain = snvk.createSwapchain(swapchainCreateInfo);

  let renderPipelineCreateInfo = {
    viewport: snvk.createViewport(),
    shaders: [vertShader, fragShader],
    bindings: [indexBinding],
    attributes: [posAttrib, colorAttrib],
  }
  let renderPipeline = snvk.createRenderPipeline(renderPipelineCreateInfo);

  let framebuffers = [];
  for (let i = 0;i<swapchain.imageCount;i++){
    let framebufferCreateInfo = {
      pipeline: renderPipeline,
      imageView: swapchain.imageViews[i],
      width: window.width,
      height: window.height,
    }
    framebuffers[i] = snvk.createFramebuffer(framebufferCreateInfo);
  }

  //snvk.drawIndexed(pipeline,framebuffer);

  let commandCreateInfo = {
    indexBuffer: indexBuffer,
    buffers: [posBuffer, colorBuffer],
    pipeline: renderPipeline,
    swapchain: swapchain,
    framebuffers: framebuffers,
  };

  let command = snvk.createCommand(commandCreateInfo);
  console.log("command")
  /*
  snvk.drawIndexed(renderPipeline);
  */
  gswapchain = swapchain
  drawFrame();
}

let gswapchain
function drawFrame(){
  //console.log("frame");
  snvk.drawFrame(gswapchain);
}

function eventLoop() {
  if (window.shouldClose()) {
    snvk.shutdownVulkan();
  }
  else {
    window.pollEvents();
    drawFrame();
    setTimeout(eventLoop, 0);

    /*
    if (lastResize !== 0 && Date.now() - lastResize > 100 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
    }
    if (Date.now() - fpsDate > 1000){
      window.title = title + ` (${fpsCount})`;
      fpsDate = Date.now();
      fpsCount = 0;
    }
    fpsCount++;
    */
  }
}
