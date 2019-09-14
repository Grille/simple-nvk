import nvk from "nvk"
import { pushHandle, deleteHandle, assertVulkan } from "../utils.mjs";
import essentials from "nvk-essentials";
import Handle from "./handle.mjs";
const { GLSL } = essentials;

export let shaderHandles = [];

export function createShader(createInfo) {
  let handle = new ShaderHandle(this, createInfo);
  pushHandle(this.shaderHandles, handle);
  return handle;
}

export function destroyShader(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.shaderHandles, handle);
}

class ShaderHandle extends Handle {
  constructor(snvk, { source, format, stage }) {
    super(snvk);
    let byteCode = null
    if (format === snvk.SHADER_SRC_GLSL) {
      let extension = "";
      switch (stage) {
        case snvk.SHADER_STAGE_VERTEX: extension = "vert"; break;
        case snvk.SHADER_STAGE_FRAGMENT: extension = "frag"; break;
        case snvk.SHADER_STAGE_COMPUTE: extension = "comp"; break;
        case snvk.SHADER_STAGE_GEOMETRY: extension = "geom"; break;
      }
      let spirvCode = GLSL.toSPIRVSync({
        source: source,
        extension: extension
      }).output;
      byteCode = new Uint8Array(spirvCode);
    }
    else {
      byteCode = new Uint8Array(source);
    }

    let shaderModuleCreateInfo = new VkShaderModuleCreateInfo({
      codeSize: byteCode.length,
      pCode: byteCode,
    });

    let shaderModule = new VkShaderModule();
    let result = vkCreateShaderModule(this.device, shaderModuleCreateInfo, null, shaderModule)
    assertVulkan(result);

    this.stage = stage;
    this.vkShader = shaderModule;
  }
  destroy() {
    vkDestroyShaderModule(this.device, this.vkShader, null);
  }

}