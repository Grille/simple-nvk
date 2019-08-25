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
  let compCreateInfo = {
    source: compSrc,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  let compShader = snvk.createShader(compCreateInfo);

  let storageBufferCreateInfo = {
    size: width * height * 4 * 4,
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

  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
  }
  let command = snvk.createCommandBuffer(commandCreateInfo);

  snvk.cmdBegin(command);

  snvk.cmdBindComputePipeline(command, computePipeline);
  snvk.cmdDispatch(command, width / workGroupSize, height / workGroupSize);

  snvk.cmdEnd(command);

  time("  vk execute...")
  let submitInfo = {
    commandBuffer: command,
    bloking: true,
  }
  snvk.submit(submitInfo);

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
