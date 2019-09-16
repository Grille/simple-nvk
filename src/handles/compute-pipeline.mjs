import { assertVulkan } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class ComputePipelineHandle extends Handle {
  constructor(snvk, { shader, entryPoint = "main", descriptors = [] }) {
    super(snvk);

    let pipelineLayout = snvk.createPipelineLayout({ descriptors, flags: (VK_SHADER_STAGE_COMPUTE_BIT) });

    let computePipelineInfo = new VkComputePipelineCreateInfo();
    computePipelineInfo.stage.stage = VK_SHADER_STAGE_COMPUTE_BIT;
    computePipelineInfo.stage.module = shader.vkShader;
    computePipelineInfo.stage.pName = entryPoint;
    computePipelineInfo.stage.pSpecializationInfo = null;
    computePipelineInfo.layout = pipelineLayout.vkPipelineLayout;

    let pipeline = new VkPipeline();
    let result = vkCreateComputePipelines(this.device, null, 1, [computePipelineInfo], null, [pipeline]);
    assertVulkan(result);

    this.vkPipeline = pipeline;
    this.layout = pipelineLayout;
  }
  destroy() {
    this.snvk.destroyHandle(this.layout);
    vkDestroyPipeline(this.device, this.vkPipeline, null);
  }
}

