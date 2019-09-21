import SNVK from "../src/snvk.mjs";
import fs from "fs";
import glm from "gl-matrix";

let lastResize = 0;
let fpsDate = Date.now();
let frameDate = Date.now();
let fpsCount = 0;
let snvk = null;
let device = null;
let window = null;
let title = "sNVK example";

let buffers = null;
let shaders = null;
let descriptors = null;
let attributes = null;

let frameAvailable = null;
let renderAvailable = null;

let surface = null;
let renderPass = null;
let renderPipeline = null;
let swapchain = null;
let commandbuffers = null;

let ready = false;

let uniformData = new Uint8Array(16 * 4 * 3)
let indexData = new Uint32Array([
  0, 1, 2,
  0, 3, 1,

  4, 5, 6,
  4, 7, 5,
])
let posData = new Float32Array([
  -0.5, -0.5, 0,
  +0.5, +0.5, 0,
  -0.5, +0.5, 0,
  +0.5, -0.5, 0,

  -0.5, -0.5, 0.5,
  +0.5, +0.5, 0.5,
  -0.5, +0.5, 0.5,
  +0.5, -0.5, 0.5,
])
let colorData = new Float32Array([
  0.5, 0, 0, 1,
  1, 0, 0, 1,
  1, 0.5, 0.5, 1,
  0.3, 0, 0, 1,

  0, 0.5, 0, 1,
  0, 1, 0, 1,
  0.5, 1, 0.5, 1,
  0, 0.3, 0, 1,
])

export function main(){
  snvk = new SNVK();
  snvk.startWindow({ width: 600, height: 600, title });
  window = snvk.window;

  console.log("start...");

  snvk.startVulkan();
  device = snvk.createDevice();

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
  let vertSrc = fs.readFileSync(`./example/render.vert`);
  let fragSrc = fs.readFileSync(`./example/render.frag`);

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

  let vertShader = device.createShader(vertCreateInfo);
  let fragShader = device.createShader(fragCreateInfo);

  let indexBufferCreateInfo = {
    size: indexData.byteLength,
    usage: snvk.BUFFER_USAGE_INDEX,
  }
  let uniformBufferCreateInfo = {
    size: uniformData.byteLength,
    usage: snvk.BUFFER_USAGE_UNIFORM,
  }
  let posBufferCreateInfo = {
    size: posData.byteLength,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }
  let colorBufferCreateInfo = {
    size: colorData.byteLength,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }

  let indexBuffer = device.createBuffer(indexBufferCreateInfo);
  indexBuffer.subData(0, indexData, 0, indexData.byteLength);

  let uniformBuffer = device.createBuffer(uniformBufferCreateInfo);
  let uniformDescriptor = uniformBuffer.getDescriptor(0, snvk.DESCRIPTOR_TYPE_UNIFORM);
  uniformBuffer.subData(0, uniformData, 0, uniformData.byteLength);

  let posBuffer = device.createBuffer(posBufferCreateInfo);
  let posBinding = posBuffer.getBinding(0, 4 * 3);
  let posAttrib = posBinding.getAttribute(0, snvk.TYPE_FLOAT32, 3);
  posBuffer.subData(0, posData, 0, posData.byteLength);

  let colorBuffer = device.createBuffer(colorBufferCreateInfo);
  let colorBinding = colorBuffer.getBinding(1, 4 * 4);
  let colorAttrib = colorBinding.getAttribute(1, snvk.TYPE_FLOAT32, 4);
  colorBuffer.subData(0, colorData, 0, colorData.byteLength);

  buffers = { indexBuffer, uniformBuffer };
  shaders = [vertShader, fragShader];
  attributes = [posAttrib, colorAttrib];
  descriptors = [uniformDescriptor];

}

function createPipeline() {
  let renderPassCreateInfo = {
    backgroundColor: [0, 0, 0.5, 1],
  }
  renderPass = device.createRenderPass(renderPassCreateInfo);

  let rasterizationInfo = {
    polygonMode: snvk.POLYGON_MODE_FILL,
    cullMode: snvk.CULL_MODE_NONE,
  }
  let renderPipelineCreateInfo = {
    rasterizationInfo: rasterizationInfo,
    renderPass: renderPass,
    viewport: device.createViewport(snvk),
    shaders: shaders,
    descriptors: descriptors,
    attributes: attributes,
  }
  renderPipeline = device.createRenderPipeline(renderPipelineCreateInfo);

  surface = device.createSurface();

  let swapchainCreateInfo = {
    width: window.width,
    height: window.height,
    renderPass: renderPass,
    surface: surface,
  }
  swapchain = device.createSwapchain(swapchainCreateInfo);

  frameAvailable = device.createSemaphore();
  renderAvailable = device.createSemaphore();

  commandbuffers = [];
  for (let i = 0; i < swapchain.framebuffers.length; i++) {
    let framebuffer = swapchain.framebuffers[i];

    let commandCreateInfo = {
      level: snvk.COMMAND_LEVEL_PRIMARY,
      usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
    }
    let command = device.createCommandBuffer(commandCreateInfo);

    command.begin();

    command.bindRenderPipeline(renderPipeline);
    command.bindIndexBuffer(buffers.indexBuffer);
    
    command.beginRender(renderPass, framebuffer);

    command.drawIndexed(0, indexData.length);

    command.endRender();

    command.end();

    commandbuffers[i] = command;
  }
  ready = true;
}

function destroyPipline() {
  ready = false;

  device.waitForIdle();
  swapchain.destroy();
  surface.destroy();
  renderPipeline.destroy();
  renderPass.destroy();
}

let lol = 0;
function drawFrame() {
  let { mat4, vec3 } = glm;
  
  let model = mat4.create();
  let view = mat4.create();
  let projection = mat4.create();
  
  mat4.rotateZ(model,model,lol+=0.01);
  mat4.lookAt(
    view,
    vec3.fromValues(2.0, 1.0, -1.0),
    vec3.fromValues(0.0, 0.0, 0.25),
    vec3.fromValues(0.0, 0.0, 1.0)
  );
  
  mat4.perspective(
    projection,
    60.0 * Math.PI / 180,
    window.width / window.height,
    0.1,
    16.0
  );

  uniformData.set(new Uint8Array(model.buffer), 0);
  uniformData.set(new Uint8Array(view.buffer), 16 * 4);
  uniformData.set(new Uint8Array(projection.buffer), 32 * 4);

  buffers.uniformBuffer.subData(0, uniformData, 0, uniformData.byteLength);

  let index = swapchain.getNextIndex(frameAvailable);
  let command = commandbuffers[index];
  let submitInfo = {
    waitSemaphore: frameAvailable,
    signalSemaphore: renderAvailable,
    commandBuffer: command,
  }
  device.submit(submitInfo);
  swapchain.present(renderAvailable);
}

function eventLoop() {
  if (window.shouldClose()) {
    snvk.shutdownVulkan();
  }
  else {
    window.pollEvents();
    if (ready) {
      if ((Date.now() - frameDate) > 10) {
        frameDate = Date.now();
        fpsCount++;
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
    setTimeout(eventLoop, 0);
  }
}
