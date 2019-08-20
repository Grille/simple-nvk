import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let computePipelineHandles = [];

export function createComputePipeline(createInfo){
  let { shader, storageBuffers = []} = createInfo;

  let descriptorSets = this.getVkDescriptorSets(storageBuffers);

  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  pipelineLayoutInfo.setLayoutCount = 1;
  pipelineLayoutInfo.pSetLayouts = [descriptorSets.descriptorSetLayout];

  let pipelineLayout = new VkPipelineLayout();
  let result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
  this.assertVulkan(result);

  let computePipelineInfo = new VkComputePipelineCreateInfo();
  computePipelineInfo.stage.stage = VK_SHADER_STAGE_COMPUTE_BIT;
  computePipelineInfo.stage.module = shader.shader;
  computePipelineInfo.stage.pName = "main";
  computePipelineInfo.stage.pSpecializationInfo = null;
  computePipelineInfo.layout = pipelineLayout;

  let pipeline = new VkPipeline();
  result = vkCreateComputePipelines(this.device, null, 1, [computePipelineInfo], null, [pipeline]);
  this.assertVulkan(result);

  let handle = {
    descriptorPool: descriptorSets.descriptorPool,
    descriptorSet: descriptorSets.descriptorSet,
    descriptorSetLayout: descriptorSets.descriptorSetLayout,
    pipelineLayout: pipelineLayout,
    pipeline: pipeline,
  };

  pushHandle(this.computePipelineHandles, handle);

  return handle;

}
export function destroyComputePipeline(handle) {
  if (handle.id === -1) return;
  vkDestroyDescriptorSetLayout(this.device, handle.descriptorSetLayout, null);
  vkDestroyPipelineLayout(this.device, handle.pipelineLayout, null);
  vkDestroyPipeline(this.device, handle.pipeline, null);
  vkDestroyDescriptorPool(this.device, handle.descriptorPool, null);
  deleteHandle(this.computePipelineHandles, handle);
}

export function compute(pipeline, x = 1, y = 1, z = 1) {

  let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
  cmdBufferAllocInfo.commandPool = this.commandPool;
  cmdBufferAllocInfo.commandBufferCount = 1;
  cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;

  let commandBuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, cmdBufferAllocInfo, [commandBuffer]);
  this.assertVulkan(result);

  // transition

  let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
  cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;

  result = vkBeginCommandBuffer(commandBuffer, cmdBufferBeginInfo);
  this.assertVulkan(result);

  vkCmdBindPipeline(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.pipeline);
  vkCmdBindDescriptorSets(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.pipelineLayout, 0, 1, [pipeline.descriptorSet], 0, null);



  vkCmdDispatch(commandBuffer, x | 0, y | 0, z | 0);

  result = vkEndCommandBuffer(commandBuffer);
  this.assertVulkan(result);

  // execution
  let submitInfo = new VkSubmitInfo();
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [commandBuffer];

  let fenceInfo = new VkFenceCreateInfo();

  let fence = new VkFence();
  result = vkCreateFence(this.device, fenceInfo, null, fence);
  this.assertVulkan(result);

  result = vkQueueSubmit(this.queue, 1, [submitInfo], fence);
  this.assertVulkan(result);

  result = vkWaitForFences(this.device, 1, [fence], VK_TRUE, 60 * 1e9);
  this.assertVulkan(result);

  vkDestroyFence(this.device, fence, null);
}