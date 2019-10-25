import { assertVulkan } from "../utils.mjs";
import Handle from "./handle.mjs";
import essentials from "nvk-essentials";
import snvk from "../index.mjs";

const { GLSL } = essentials;

export default class ShaderHandle extends Handle {
  constructor(owner, { source, format, stage }) {
    super(owner);
    let byteCode = null
    if (format === snvk.SHADER_SRC_GLSL) {
      let extension = "";
      switch (stage) {
        case snvk.SHADER_STAGE_VERTEX: extension = "vert"; break;
        case snvk.SHADER_STAGE_FRAGMENT: extension = "frag"; break;
        case snvk.SHADER_STAGE_COMPUTE: extension = "comp"; break;
        case snvk.SHADER_STAGE_GEOMETRY: extension = "geom"; break;
      }
      let { output, error } = GLSL.toSPIRVSync({
        source: source,
        extension: extension
      });
      byteCode = new Uint8Array(output);
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
    this.super_destroy();
    vkDestroyShaderModule(this.device, this.vkShader, null);
  }

}