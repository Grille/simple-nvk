import Vulkan from "./vulkan/vulkan.mjs";
import fs from "fs";

let lastResize = 0;
let fpsDate = Date.now();
let fpsCount = 0;
let snvk = null;
let window = null;
let title = "sNVK example";

let buffers = null;
let shaders = null;
let bindings = null;
let attributes = null;

let surface = null;
let renderPipeline = null;
let swapchain = null;
let framebuffers = null;
let command = null;

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
  snvk.startVulkan();
  createInput();
  createPipeline();

  eventLoop();
  
  window.onresize = () => {
    if (ready){
      destroyPipline();
    }
    lastResize = Date.now();
  }
  
}

function createInput() {
  console.log("setup...");
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
  console.log("start...");
  let renderPass = snvk.createRenderPass();

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

  //snvk.drawIndexed(pipeline,framebuffer);

  let commandCreateInfo = {
    indexBuffer: buffers[0],
    buffers: [buffers[1], buffers[2]],
    pipeline: renderPipeline,
    swapchain: swapchain,
    framebuffers: swapchain.framebuffers,
  };

  command = snvk.createCommand(commandCreateInfo);
  ready = true;
  console.log("started");
}

function destroyPipline(){
  console.log("destroy...");
  ready = false;

  snvk.waitIdle();
  /*
  for (let i = 0;i<framebuffers.length;i++){
    snvk.destroyFramebuffer(framebuffers[i]);
  }
  */
  snvk.destroySwapchain(swapchain);
  /*
  snvk.destroyRenderPipeline(renderPipeline);
  snvk.destroyRenderPipeline(renderPipeline);
  snvk.destroyRenderPipeline(renderPipeline);
  */
  console.log("destroyed");
}

function drawFrame(){
  //let framebuffer = snvk.getNextSwapchainFramebuffer(swapchain);
  snvk.drawFrame(swapchain);
}

function eventLoop() {
  if (window.shouldClose()) {
    snvk.shutdownVulkan();
  }
  else {
    window.pollEvents();
    if (ready) {
      drawFrame();
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
