import snvk from "../src/index.mjs";
import fs from "fs";
import pngjs from "pngjs"; const { PNG } = pngjs;

let width = 800;
let height = 800;
let workGroupSize = 32;

export function main() {
  console.log("compute example")
  console.time("start")

  snvk.startVulkan();
  let device = snvk.createDevice();
  
  console.timeLog("start")
  console.time("setup")

  let compSrc = fs.readFileSync(`./example/compute.comp`);
  let compCreateInfo = {
    source: compSrc,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  let compShader = device.createShader(compCreateInfo);

  let uniformData = new Uint32Array([
    width, height
  ])
  let uniformBufferCreateInfo = {
    size: uniformData.byteLength,
    usage: snvk.BUFFER_USAGE_UNIFORM,
    staging: snvk.BUFFER_STAGING_STATIC,
  }
  let storageBufferCreateInfo = {
    size: width * height * 4 * 4,
    usage: snvk.BUFFER_USAGE_STORAGE,
    staging: snvk.BUFFER_STAGING_STATIC,
    readable: true,
  }

  let uniformBuffer = device.createBuffer(uniformBufferCreateInfo);
  let uniformDescriptor = uniformBuffer.getDescriptor(1, snvk.DESCRIPTOR_TYPE_UNIFORM);
  uniformBuffer.subData(0, uniformData, 0, uniformData.byteLength);

  let storageBuffer = device.createBuffer(storageBufferCreateInfo);
  let storageDescriptor = storageBuffer.getDescriptor(0, snvk.DESCRIPTOR_TYPE_STORAGE);

  let computePipelineCreateInfo = {
    shader: compShader,
    descriptors: [uniformDescriptor, storageDescriptor],
  }
  let computePipeline = device.createComputePipeline(computePipelineCreateInfo);

  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_ONE_TIME,
    queue: snvk.COMMAND_QUEUE_COMPUTE,
  }
  let command = device.createCommandBuffer(commandCreateInfo);

  command.begin();

  command.bindComputePipeline(computePipeline);
  command.dispatch(width, height, 1);

  command.end();

  console.timeLog("setup")
  console.time("execute")

  let submitInfo = {
    commandBuffer: command,
    blocking: true,
  }
  device.submit(submitInfo);

  console.timeLog("execute")
  console.time("readback")

  let view = new Float32Array(storageBuffer.readData());

  console.timeLog("readback")
  console.time("pack")
  
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
  
  png.pack().pipe(fs.createWriteStream("test.png"));

  console.timeLog("pack")
  console.time("shutdown")

  snvk.shutdown();

  console.timeLog("shutdown")
  console.log("finish.\n")
}