import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let computePipelineHandles = [];

export function createComputePipeline(createInfo){
  let { shader, entryPoint = "main", descriptors = [] } = createInfo;
  
  let pipelineLayout = this.createPipelineLayout(descriptors, VK_SHADER_STAGE_COMPUTE_BIT);

  let computePipelineInfo = new VkComputePipelineCreateInfo();
  computePipelineInfo.stage.stage = VK_SHADER_STAGE_COMPUTE_BIT;
  computePipelineInfo.stage.module = shader.vkShader;
  computePipelineInfo.stage.pName = entryPoint;
  computePipelineInfo.stage.pSpecializationInfo = null;
  computePipelineInfo.layout = pipelineLayout.vkPipelineLayout;

  let pipeline = new VkPipeline();
  let result = vkCreateComputePipelines(this.device, null, 1, [computePipelineInfo], null, [pipeline]);
  this.assertVulkan(result);

  let handle = {
    vkPipeline: pipeline,
    layout: pipelineLayout,
  };

  pushHandle(this.computePipelineHandles, handle);

  return handle;

}

export function destroyComputePipeline(handle) {
  if (handle.id === -1) return;
  this.destroyPipelineLayout(handle.layout);
  vkDestroyPipeline(this.device, handle.vkPipeline, null);
  deleteHandle(this.computePipelineHandles, handle);
}

