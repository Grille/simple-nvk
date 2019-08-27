import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let commandBufferHandles = [];

export function createCommandBuffer(createInfo) {
  let { level, usage } = createInfo;

  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = level;
  commandBufferAllocateInfo.commandBufferCount = 1;

  let commandBuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, [commandBuffer]);
  this.assertVulkan(result);

  let handle = {
    vkCommandBuffer: commandBuffer,
    level: level,
    usage: usage,
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
  commandBufferBeginInfo.flags = commandBuffer.usage;
  commandBufferBeginInfo.pInheritanceInfo = null;

  let result = vkBeginCommandBuffer(vkCommandBuffer, commandBufferBeginInfo);
  this.assertVulkan(result);
}

export function cmdBeginRender(commandBuffer, pipeline, frambuffer, backColor) {
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
      float32: pipeline.backgroundColor,
    }),
    depthStencil: null,
  })];

  vkCmdBeginRenderPass(vkCommandBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

  vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);

  if (pipeline.layout.vkaSets.length > 0) {
    vkCmdBindDescriptorSets(vkCommandBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.layout.vkPipelineLayout, 0, pipeline.layout.vkaSets.length, pipeline.layout.vkaSets, 0, null);
  }

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

export function cmdDrawArrays(commandBuffer, offset, length) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdDraw(vkCommandBuffer, length, 1, offset, 0);
}

export function cmdDrawIndexed(commandBuffer, offset, length) {
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

export function cmdBindComputePipeline(commandBuffer, pipeline) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.vkPipeline);
  if (pipeline.layout.vkaSets.length > 0) {
    vkCmdBindDescriptorSets(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.layout.vkPipelineLayout, 0, pipeline.layout.vkaSets.length, pipeline.layout.vkaSets, 0, null);
  }
}

export function cmdDispatch(commandBuffer, x = 1, y = 1, z = 1) {
  let { vkCommandBuffer } = commandBuffer;

  vkCmdDispatch(vkCommandBuffer, x | 0, y | 0, z | 0);
}

export function cmdCopyBuffer(commandBuffer, src, srcOffset, dst, dstOffset, length) {
  let { vkCommandBuffer } = commandBuffer;

  let bufferCopy = new VkBufferCopy();
  bufferCopy.srcOffset = srcOffset;
  bufferCopy.dstOffset = dstOffset;
  bufferCopy.size = length;

  vkCmdCopyBuffer(vkCommandBuffer, src.vksLocal.vkBuffer, dst.vksLocal.vkBuffer, 1, [bufferCopy]);
}

export function submit(submitInfo) {
  let { commandBuffer, waitSemaphore = null, signalSemaphore = null, signalFence = {}, blocking = false } = submitInfo;
  let { vkFence = null } = signalFence;

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
    let fence = this.createFence();
  
    let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], fence.vkFence);
    this.assertVulkan(result);
  
    this.waitForFence(fence, 60 * 1E3);
    this.destroyFence(fence);
  }
  else {
    let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
    this.assertVulkan(result);
  }

}