import fs from "fs"
import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
import { GLSL } from "nvk-essentials"

export let shaderChanged = false;
export let shaderHandles = [];
export let shaderStages = new Array(10).fill(null);

export function loadShaderSrc(path) {
  return fs.readFileSync(path);
}

export function createShader(code, stage) {

  let extension = "";
  switch (stage) {
    case this.SHADER_STAGE_VERTEX: extension = "vert"; break;
    case this.SHADER_STAGE_FRAGMENT: extension = "frag"; break;
    case this.SHADER_STAGE_COMPUTE: extension = "comp"; break;
  }
  
  let spirvCode = GLSL.toSPIRVSync({
    source: code,
    extension: extension
  }).output;

  let uIntCode = new Uint8Array(spirvCode);
  let shaderModuleCreateInfo = new VkShaderModuleCreateInfo({
    codeSize: uIntCode.length,
    pCode: uIntCode,
  });

  let shaderModule = new VkShaderModule();
  let result = vkCreateShaderModule(this.device, shaderModuleCreateInfo, null, shaderModule)
  this.assertVulkan(result);

  let handle = {
    id: -1,
    stage: stage,
    shader: shaderModule,
  }

  pushHandle(this.shaderHandles, handle);

  return handle;
}
export function bindShader(handle, stage = handle.stage) {
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