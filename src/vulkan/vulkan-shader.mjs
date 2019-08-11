import fs from "fs"
import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
import { GLSL } from "nvk-essentials"

export let shaderChanged = false;
export let shaderHandles = [];
export let shaderStages = new Array(10).fill(null);

export function loadShaderSrc(path, type) {
  if (this.shaderSrcCache[path] === undefined)
    this.shaderSrcCache[path] = GLSL.toSPIRVSync({
      source: fs.readFileSync(path),
      extension: type
    }).output;
  return this.shaderSrcCache[path];
}

export function createShader(code) {
  let shader = this.createShaderModule(code);

  let handle = {
    id: -1,
    stage: -1,
    shader: shader,
  }

  pushHandle(this.shaderHandles, handle);

  return handle;
}
export function bindShader(handle, stage) {
  if (this.shaderStages[stage] !== null) this.shaderStages[stage].stage = -1;
  handle.stage = stage;
  this.shaderStages[stage] = handle;
}

export function destroyShader(handle) {
  if (handle.id === -1) return;
  this.shaderChanged = true;
  vkDestroyShaderModule(this.device, handle.shader, null);
  deleteHandle(this.shaderHandles, handle);
}


export function createShaderModule(code) {
  let uIntCode = new Uint8Array(code);
  let shaderModuleCreateInfo = new VkShaderModuleCreateInfo({
    codeSize: uIntCode.length,
    pCode: uIntCode,
  });

  let shaderModule = new VkShaderModule();
  let result = vkCreateShaderModule(this.device, shaderModuleCreateInfo, null, shaderModule)
  this.assertVulkan(result);

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