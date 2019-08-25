import Vulkan from "./vulkan/vulkan.mjs";
import fs from "fs";

let lastResize = 0;
let fpsDate = Date.now();
let frameDate = Date.now();
let fpsCount = 0;
let snvk = null;
let window = null;
let title = "sNVK example";

let buffers = null;
let shaders = null;
let bindings = null;
let attributes = null;

let surface = null;
let renderPass = null;
let renderPipeline = null;
let swapchain = null;
let commandbuffers = null;

let ready = false;

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

  console.log("start...");

  snvk.startVulkan();
  createInput();
  createPipeline();

  console.log("started");

  eventLoop();
  
  window.onresize = () => {
    if (ready){
      destroyPipline();
    }
    lastResize = Date.now();
  }

  console.log("finish.");
}

function createInput() {
  let vertSrc = snvk.loadShaderSrc(`./src/shader/shader.vert`);
  let fragSrc = snvk.loadShaderSrc(`./src/shader/shader.frag`);

  //snvk.bindShader(compShader);

  let vertCreateInfo = {
    source: vertSrc,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_VERTEX,
  }
  let fragCreateInfo = {
    source: fragSrc,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_FRAGMENT,
  }

  let vertShader = snvk.createShader(vertCreateInfo);
  let fragShader = snvk.createShader(fragCreateInfo);


  let indexBufferCreateInfo = {
    size: 2 * 4 * 3,
    usage: snvk.BUFFER_USAGE_INDEX,
  }
  let posBufferCreateInfo = {
    size: 6 * 4 * 2,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }
  let colorBufferCreateInfo = {
    size: 6 * 4 * 3,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }

  let indexBuffer = snvk.createBuffer(indexBufferCreateInfo);
  snvk.bufferSubData(indexBuffer, 0, indexData, 0, 2 * 4 * 3);

  let posBuffer = snvk.createBuffer(posBufferCreateInfo);
  let posBinding = snvk.getBinding(posBuffer, 0, 4 * 2);
  let posAttrib = snvk.getAttribute(posBinding, 0, snvk.TYPE_FLOAT32, 2);
  snvk.bufferSubData(posBuffer, 0, posData, 0, 6 * 4 * 2);

  let colorBuffer = snvk.createBuffer(colorBufferCreateInfo);
  let colorBinding = snvk.getBinding(colorBuffer, 1, 4 * 3);
  let colorAttrib = snvk.getAttribute(colorBinding, 1, snvk.TYPE_FLOAT32, 3);
  snvk.bufferSubData(colorBuffer, 0, colorData, 0, 6 * 4 * 3);

  buffers = [indexBuffer, posBuffer, colorBuffer];
  shaders = [vertShader, fragShader];
  bindings = [posBinding, colorBinding];
  attributes = [posAttrib, colorAttrib];

}
function createPipeline() {
  renderPass = snvk.createRenderPass();

  let renderPipelineCreateInfo = {
    renderPass: renderPass,
    viewport: snvk.createViewport(),
    shaders: shaders,
    bindings: bindings,
    attributes: attributes,
  }
  renderPipeline = snvk.createRenderPipeline(renderPipelineCreateInfo);

  surface = snvk.createSurface();

  let swapchainCreateInfo = {
    width: window.width,
    height: window.height,
    renderPass: renderPass,
    surface: surface,
  }
  swapchain = snvk.createSwapchain(swapchainCreateInfo);

  commandbuffers = [];
  for (let i = 0; i < swapchain.framebuffers.length; i++) {
    let framebuffer = swapchain.framebuffers[i];
    let command = snvk.createCommandbuffer();

    snvk.cmdBegin(command);

    snvk.cmdBeginRender(command, renderPipeline, framebuffer);
    snvk.cmdBindIndexBuffer(command, buffers[0]);
    snvk.cmdDrawIndexed(command);

    snvk.cmdEndRender(command);

    snvk.cmdEnd(command);

    commandbuffers[i] = command;
  }
  ready = true;
}

function destroyPipline(){
  ready = false;

  snvk.waitIdle();

  snvk.destroySwapchain(swapchain);
  snvk.destroySurface(surface);
  snvk.destroyRenderPipeline(renderPipeline);
  snvk.destroyRenderPass(renderPass);
  
}

function drawFrame() {
  let index = snvk.getNextSwapchainIndex(swapchain);
  snvk.submit(commandbuffers[index]);
  snvk.present(swapchain);
}

function eventLoop() {
  if (window.shouldClose()) {
    snvk.shutdownVulkan();
  }
  else {
    window.pollEvents();
    if (ready) {
      if ((Date.now() - frameDate) > 2000) {
        frameDate = Date.now();
        drawFrame();
      }
    }
    if (lastResize !== 0 && Date.now() - lastResize > 100 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
      createPipeline();
    }
    if (Date.now() - fpsDate > 1000) {
      window.title = title + ` (${fpsCount})`;
      fpsDate = Date.now();
      fpsCount = 0;
    }
    fpsCount++;
    setTimeout(eventLoop, 0);
  }
}
