import nvk from "nvk"
import { pushHandle, deleteHandle, assertVulkan } from "../utils.mjs"
import { createPipelineLayout, destroyPipelineLayout } from "../vulkan-pipeline.mjs"
import Handle from "./handle.mjs";

export let computePipelineHandles = [];

export function createComputePipeline(createInfo) {
  let handle = new ComputePipelineHandle(this, createInfo);
  pushHandle(this.computePipelineHandles, handle);
  return handle;
}

export function destroyComputePipeline(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.computePipelineHandles, handle);
}

class ComputePipelineHandle extends Handle {
  constructor(snvk, { shader, entryPoint = "main", descriptors = [] }) {
    super(snvk);

    let pipelineLayout = createPipelineLayout(snvk, descriptors, VK_SHADER_STAGE_COMPUTE_BIT);

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
    destroyPipelineLayout(this.snvk, this.layout);
    vkDestroyPipeline(this.device, this.vkPipeline, null);
  }
}

