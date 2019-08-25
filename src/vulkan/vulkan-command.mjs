import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let commandBufferHandles = [];

export function createCommandBuffer() {
  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = 1;

  let commandBuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, [commandBuffer]);
  this.assertVulkan(result);

  let handle = {
    vkCommandBuffer: commandBuffer,
  }

  pushHandle(this.commandBufferHandles, handle);

  return handle;
}

export function destroyCommandBuffer(handle) {
  vkFreeCommandBuffers(this.device, this.commandPool, 1, [handle.vkCommandBuffer]);
  deleteHandle(this.commandBufferHandles, handle);
}

export function cmdBegin(commandBuffer) {
  let { vkCommandBuffer } = commandBuffer;

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  let result = vkBeginCommandBuffer(vkCommandBuffer, commandBufferBeginInfo);
  this.assertVulkan(result);
}

export function cmdBeginRender(commandBuffer, pipeline, frambuffer) {
  let { vkCommandBuffer } = commandBuffer;

  let renderPassBeginInfo = new VkRenderPassBeginInfo();
  renderPassBeginInfo.renderPass = pipeline.vkRenderPass;
  renderPassBeginInfo.framebuffer = frambuffer.vkFramebuffer;
  renderPassBeginInfo.renderArea.offset.x = 0;
  renderPassBeginInfo.renderArea.offset.y = 0;
  renderPassBeginInfo.renderArea.extent.width = frambuffer.width;
  renderPassBeginInfo.renderArea.extent.height = frambuffer.height;
  renderPassBeginInfo.clearValueCount = 1;
  renderPassBeginInfo.pClearValues = [new VkClearValue({
    color: new VkClearColorValue({
      float32: [0, 0, 0.5, 1],
    }),
    depthStencil: null,
  })];

  vkCmdBeginRenderPass(vkCommandBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

  vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);

  let vertexBindings = pipeline.vertexBindings;
  let offsets = new BigUint64Array(vertexBindings.length);
  let vertexBuffers = [];

  for (let i = 0; i < vertexBindings.length; i++) {
    vertexBuffers[i] = vertexBindings[i].buffer.vksLocal.vkBuffer;
  }

  vkCmdBindVertexBuffers(vkCommandBuffer, 0, vertexBuffers.length, vertexBuffers, offsets);
}

/*
  let viewport = new VkViewport();
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = frambuffer.width;
  viewport.height = frambuffer.height;
  viewport.minDepth = 0;
  viewport.maxDepth = 1;
 
  let scissor = new VkRect2D();
  scissor.offset.x = 0;
  scissor.offset.y = 0;
  scissor.extent.width = frambuffer.width;
  scissor.extent.height = frambuffer.height;
 
  vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);
 
  vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);
*/

export function cmdBindIndexBuffer(commandBuffer, indexBuffer) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdBindIndexBuffer(vkCommandBuffer, indexBuffer.vksLocal.vkBuffer, 0, VK_INDEX_TYPE_UINT32);
}
export function cmdDrawIndexed(commandBuffer,offset,length) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdDrawIndexed(vkCommandBuffer, length, 1, offset, 0, 0);
}

export function cmdEndRender(commandBuffer) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdEndRenderPass(vkCommandBuffer);
}
export function cmdEnd(commandBuffer) {
  let { vkCommandBuffer } = commandBuffer;

  let result = vkEndCommandBuffer(vkCommandBuffer);
  this.assertVulkan(result);
}

export function submitFence(commandBuffer) {
  let { vkCommandBuffer } = commandBuffer;

  let submitInfo = new VkSubmitInfo();
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [vkCommandBuffer];

  let fenceInfo = new VkFenceCreateInfo();

  let fence = new VkFence();
  let result = vkCreateFence(this.device, fenceInfo, null, fence);
  this.assertVulkan(result);

  result = vkQueueSubmit(this.queue, 1, [submitInfo], fence);
  this.assertVulkan(result);

  result = vkWaitForFences(this.device, 1, [fence], VK_TRUE, 60 * 1e9);
  this.assertVulkan(result);

  vkDestroyFence(this.device, fence, null);

}

export function cmdBindComputePipeline(commandBuffer, pipeline) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.vkPipeline);
  vkCmdBindDescriptorSets(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.vkLayout, 0, 1, [pipeline.vksStorageDescriptors.vkSet], 0, null);
}

export function cmdDispatch(commandBuffer, x = 1, y = 1, z = 1) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdDispatch(vkCommandBuffer, x | 0, y | 0, z | 0);
}

export function submit(submitInfo) {
  let { commandBuffer, waitSemaphore = null, signalSemaphore = null, blocking = false } = submitInfo;

  let vkSubmitInfo = new VkSubmitInfo();
  vkSubmitInfo.pWaitDstStageMask = new Int32Array([VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT]);
  vkSubmitInfo.commandBufferCount = 1;
  vkSubmitInfo.pCommandBuffers = [commandBuffer.vkCommandBuffer];
  if (waitSemaphore !== null) {
    vkSubmitInfo.waitSemaphoreCount = 1;
    vkSubmitInfo.pWaitSemaphores = [waitSemaphore.vkSemaphore];
  }
  if (signalSemaphore !== null) {
    vkSubmitInfo.signalSemaphoreCount = 1;
    vkSubmitInfo.pSignalSemaphores = [signalSemaphore.vkSemaphore];
  }

  if (blocking) {
    let fenceInfo = new VkFenceCreateInfo();
    let fence = new VkFence();
    let result = vkCreateFence(this.device, fenceInfo, null, fence);
    this.assertVulkan(result);
  
    result = vkQueueSubmit(this.queue, 1, [submitInfo], fence);
    this.assertVulkan(result);
  
    result = vkWaitForFences(this.device, 1, [fence], VK_TRUE, 60 * 1e9);
    this.assertVulkan(result);
  
    vkDestroyFence(this.device, fence, null);
  }
  else {
    let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], null);
    this.assertVulkan(result);
  }

}