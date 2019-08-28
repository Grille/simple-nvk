import fs from "fs"
import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
import essentials from "nvk-essentials"; const {GLSL} = essentials;

export let shaderChanged = false;
export let shaderHandles = [];
export let shaderStages = new Array(10).fill(null);

export function loadShaderSrc(path) {
  return fs.readFileSync(path);
}
export function createShader(createInfo) {
  let { source, format, stage } = createInfo;
  let uIntCode = null
  if (format === this.SHADER_SRC_GLSL) {
    let extension = "";
    switch (stage) {
      case this.SHADER_STAGE_VERTEX: extension = "vert"; break;
      case this.SHADER_STAGE_FRAGMENT: extension = "frag"; break;
      case this.SHADER_STAGE_COMPUTE: extension = "comp"; break;
      case this.SHADER_STAGE_GEOMETRY: extension = "geom"; break;
    }
    let spirvCode = GLSL.toSPIRVSync({
      source: source,
      extension: extension
    }).output;
    uIntCode = new Uint8Array(spirvCode);
  }
  else {
    uIntCode = new Uint8Array(source);
  }

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
    vkShader: shaderModule,
  }

  pushHandle(this.shaderHandles, handle);

  return handle;
}

export function destroyShader(handle) {
  if (handle.id === -1) return;
  this.shaderChanged = true;
  vkDestroyShaderModule(this.device, handle.vkShader, null);
  deleteHandle(this.shaderHandles, handle);
}