import Vulkan from "./vulkan/vulkan.mjs";
import fs from "fs";
import pngjs from "pngjs"; const { PNG } = pngjs;

let snvk = new Vulkan();
let width = 800;
let height = 600;
let workGroupSize = 32;
let date = Date.now();

export function main() {
  print("compute example\n")
  date = Date.now();
  print("  vk start...")
  snvk.startWindow({ width: 480, height: 320, title:"vf" });
  snvk.startVulkan();
  snvk.closeWindow();

  time("  vk setup...")
  let compSrc = snvk.loadShaderSrc(`./src/shader/shader.comp`);
  let compShader = snvk.createShader(compSrc, snvk.SHADER_SRC_GLSL, snvk.SHADER_STAGE_COMPUTE);
  //snvk.bindShader(vertShader);

  let storageBufferCreateInfo = {
    type: snvk.TYPE_FLOAT32,
    size: 4,
    length: width * height,
    usage: snvk.BUFFER_USAGE_STORAGE,
    readable: true,
  }

  let storageBuffer = snvk.createBuffer(storageBufferCreateInfo);
  let stroageBinding = snvk.getBinding(storageBuffer, 0);
  
  let computePipelineCreateInfo = {
    shader: compShader,
    bindings: [stroageBinding],
  }
  let computePipeline = snvk.createComputePipeline(computePipelineCreateInfo);

  time("  vk execute...")
  snvk.compute(computePipeline, width / workGroupSize, height / workGroupSize);

  time("  vk readback...")
  let view = new Float32Array(snvk.bufferReadData(storageBuffer));

  time("  png pack...")
  let png = new PNG({
    width: width,
    height: height,
    filterType: 4
  });
  for (let ii = 0; ii < view.length; ii += 4) {
    png.data[ii + 0] = 255 * view[ii + 0];
    png.data[ii + 1] = 255 * view[ii + 1];
    png.data[ii + 2] = 255 * view[ii + 2];
    png.data[ii + 3] = 255 * view[ii + 3];
  };

  time("  png save...")
  png.pack().pipe(fs.createWriteStream("test.png"));

  time("  vk shutdown...")
  snvk.shutdownVulkan();

  time("finish.\n")
}

function print(message) {
  process.stdout.write(message);
}
function time(message) {
  print(" " + (Date.now() - date) + "ms\n");
  print(message);
  date = Date.now();
}