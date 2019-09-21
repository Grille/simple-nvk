import Vulkan from "../src/vulkan.mjs";
import fs from "fs";
import pngjs from "pngjs"; const { PNG } = pngjs;

let snvk = new Vulkan();
let width = 800;
let height = 800;
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
  let compSrc = fs.readFileSync(`./example/compute.comp`);
  let compCreateInfo = {
    source: compSrc,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  let compShader = snvk.createShader(compCreateInfo);

  let uniformData = new Uint32Array([
    width, height
  ])
  let uniformBufferCreateInfo = {
    size: uniformData.byteLength,
    usage: snvk.BUFFER_USAGE_UNIFORM,
  }
  let storageBufferCreateInfo = {
    size: width * height * 4 * 4,
    usage: snvk.BUFFER_USAGE_STORAGE,
    readable: true,
  }

  let uniformBuffer = snvk.createBuffer(uniformBufferCreateInfo);
  let uniformDescriptor = uniformBuffer.getDescriptor(1, snvk.DESCRIPTOR_TYPE_UNIFORM);
  uniformBuffer.subData(0, uniformData, 0, uniformData.byteLength);

  let storageBuffer = snvk.createBuffer(storageBufferCreateInfo);
  let storageDescriptor = storageBuffer.getDescriptor(0, snvk.DESCRIPTOR_TYPE_STORAGE);

  let computePipelineCreateInfo = {
    shader: compShader,
    descriptors: [uniformDescriptor, storageDescriptor],
  }
  let computePipeline = snvk.createComputePipeline(computePipelineCreateInfo);

  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_ONE_TIME,
  }
  let command = snvk.createCommandBuffer(commandCreateInfo);

  command.begin();

  command.bindComputePipeline(computePipeline);
  command.dispatch(width, height, 1);

  command.end();

  time("  vk execute...")
  let submitInfo = {
    commandBuffer: command,
    blocking: true,
  }
  snvk.submit(submitInfo);

  time("  vk readback...")
  let view = new Float32Array(storageBuffer.readData());

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
