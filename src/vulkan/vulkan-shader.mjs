import fs from "fs"
import nvk from "nvk"
import { GLSL } from "nvk-essentials"

Object.assign(global, nvk);

function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

export function loadShaderSrc(path, type) {
  if (this.shaderSrcCache[path] === undefined)
    this.shaderSrcCache[path] = GLSL.toSPIRVSync({
      source: fs.readFileSync(path),
      extension: type
    }).output;
  return this.shaderSrcCache[path];
}

export function createShaderModule(code) {
  let uIntCode = new Uint8Array(code);
  let shaderModuleCreateInfo = new VkShaderModuleCreateInfo({
    codeSize: uIntCode.length,
    pCode: uIntCode,
  });

  let shaderModule = new VkShaderModule();
  let result = vkCreateShaderModule(this.device, shaderModuleCreateInfo, null, shaderModule)
  ASSERT_VK_RESULT(result);

  let index = this.shaderModules.length;
  for (let i = 0; i < this.shaderModules.length; i++) {
    if (this.shaderModules[i] === null) {
      index = i;
      break;
    }
  }
  this.shaderModules[index] = shaderModule;
  return shaderModule;
}