import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let computePipelineHandles = [];

export function createComputePipeline(createInfo){
  let { shader, buffer } = createInfo;

  let storageLayoutBinding = new VkDescriptorSetLayoutBinding();
  storageLayoutBinding.binding = 0;
  storageLayoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
  storageLayoutBinding.descriptorCount = 1;
  storageLayoutBinding.stageFlags = VK_SHADER_STAGE_COMPUTE_BIT;
  storageLayoutBinding.pImmutableSamplers = null;

  let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
  layoutInfo.bindingCount = 1;
  layoutInfo.pBindings = [storageLayoutBinding];

  let descriptorSetLayout = new VkDescriptorSetLayout();
  let result = vkCreateDescriptorSetLayout(this.device, layoutInfo, null, descriptorSetLayout);
  this.assertVulkan(result);

  let descriptorPoolSize = new VkDescriptorPoolSize();
  descriptorPoolSize.type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
  descriptorPoolSize.descriptorCount = 1;

  let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
  descriptorPoolInfo.maxSets = 1;
  descriptorPoolInfo.poolSizeCount = 1;
  descriptorPoolInfo.pPoolSizes = [descriptorPoolSize];

  let descriptorPool = new VkDescriptorPool();
  result = vkCreateDescriptorPool(this.device, descriptorPoolInfo, null, descriptorPool);
  this.assertVulkan(result);

  // descriptorsets
  let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
  descriptorSetAllocInfo.descriptorPool = descriptorPool;
  descriptorSetAllocInfo.descriptorSetCount = 1;
  descriptorSetAllocInfo.pSetLayouts = [descriptorSetLayout];

  let descriptorSet = new VkDescriptorSet();
  result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, [descriptorSet]);
  this.assertVulkan(result);

  let bufferInfo = new VkDescriptorBufferInfo();
  bufferInfo.buffer = buffer.local.buffer;
  bufferInfo.offset = 0n;
  bufferInfo.range = buffer.length * buffer.stride;

  let writeDescriptorSet = new VkWriteDescriptorSet();
  writeDescriptorSet.dstSet = descriptorSet;
  writeDescriptorSet.dstBinding = 0;
  writeDescriptorSet.descriptorCount = 1;
  writeDescriptorSet.descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
  writeDescriptorSet.pBufferInfo = [bufferInfo];

  vkUpdateDescriptorSets(this.device, 1, [writeDescriptorSet], 0, null);


  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  pipelineLayoutInfo.setLayoutCount = 1;
  pipelineLayoutInfo.pSetLayouts = [descriptorSetLayout];

  let pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
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
    descriptorPool: descriptorPool,
    descriptorSet: descriptorSet,
    descriptorSetLayout: descriptorSetLayout,
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

export function execute(handle) {

  let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
  cmdBufferAllocInfo.commandPool = this.commandPool;
  cmdBufferAllocInfo.commandBufferCount = 1;
  cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;

  let commandBuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, cmdBufferAllocInfo, [commandBuffer]);
  this.assertVulkan(result);

  // transition
  console.log("  Creating transition..");
  let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
  cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;

  result = vkBeginCommandBuffer(commandBuffer, cmdBufferBeginInfo);
  this.assertVulkan(result);

  vkCmdBindPipeline(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, handle.pipeline);
  vkCmdBindDescriptorSets(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, handle.pipelineLayout, 0, 1, [handle.descriptorSet], 0, null);

  let width = 3200;
  let height = 2400;
  let workGroupSize = 32;

  vkCmdDispatch(commandBuffer, (width / workGroupSize) | 0, (height / workGroupSize) | 0, 1);

  result = vkEndCommandBuffer(commandBuffer);
  this.assertVulkan(result);

  // execution
  console.log("  Executing command buffers..");
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