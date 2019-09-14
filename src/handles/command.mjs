import nvk from "nvk"
import Handle from "./handle.mjs";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "../utils.mjs"

export let commandBufferHandles = [];

export function createCommandBuffer(createInfo) {
  return new CommandBufferHandle(this, createInfo);
}

export function destroyCommandBuffer(handle) {
  handle.destroy();
}

class CommandBufferHandle extends Handle {
  constructor(snvk, { level, usage }) {
    super(snvk);

    let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
    commandBufferAllocateInfo.commandPool = snvk.commandPool;
    commandBufferAllocateInfo.level = level;
    commandBufferAllocateInfo.commandBufferCount = 1;

    let vkCommandBuffer = new VkCommandBuffer();
    let result = vkAllocateCommandBuffers(snvk.device, commandBufferAllocateInfo, [vkCommandBuffer]);
    assertVulkan(result);

    this.vkCommandBuffer = vkCommandBuffer;
    this.level = level;
    this.usage = usage;

    pushHandle(snvk.commandBufferHandles, this);
  }

  destroy() {
    let { snvk } = this;
    if (this.id === -1) return;
    vkFreeCommandBuffers(snvk.device, snvk.commandPool, 1, [this.vkCommandBuffer]);
    deleteHandle(snvk.commandBufferHandles, this);
  }

  begin() {
    let { vkCommandBuffer } = this;

    let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
    commandBufferBeginInfo.flags = this.usage;
    commandBufferBeginInfo.pInheritanceInfo = null;

    let result = vkBeginCommandBuffer(vkCommandBuffer, commandBufferBeginInfo);
    assertVulkan(result);
  }

  bindRenderPipeline(pipeline) {
    let { vkCommandBuffer } = this;

    vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);

    if (pipeline.layout.enabled)
      vkCmdBindDescriptorSets(vkCommandBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.layout.vkPipelineLayout, 0, 1, [pipeline.layout.vkSet], 0, null);

    let vertexBindings = pipeline.vertexBindings;
    let offsets = new BigUint64Array(vertexBindings.length);
    let vertexBuffers = [];

    for (let i = 0; i < vertexBindings.length; i++) {
      vertexBuffers[i] = vertexBindings[i].buffer.vksLocal.vkBuffer;
    }

    vkCmdBindVertexBuffers(vkCommandBuffer, 0, vertexBuffers.length, vertexBuffers, offsets);
  }

  beginRender(renderPass, frambuffer, backColor) {
    let { vkCommandBuffer } = this;

    let renderPassBeginInfo = new VkRenderPassBeginInfo();
    renderPassBeginInfo.renderPass = renderPass.vkRenderPass;
    renderPassBeginInfo.framebuffer = frambuffer.vkFramebuffer;
    renderPassBeginInfo.renderArea.offset.x = 0;
    renderPassBeginInfo.renderArea.offset.y = 0;
    renderPassBeginInfo.renderArea.extent.width = frambuffer.width;
    renderPassBeginInfo.renderArea.extent.height = frambuffer.height;
    renderPassBeginInfo.clearValueCount = 1;
    renderPassBeginInfo.pClearValues = [new VkClearValue({
      color: new VkClearColorValue({
        float32: renderPass.backgroundColor,
      }),
      depthStencil: null,
    })];

    vkCmdBeginRenderPass(vkCommandBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);
  }

  bindIndexBuffer(indexBuffer) {
    let { vkCommandBuffer } = this;

    vkCmdBindIndexBuffer(vkCommandBuffer, indexBuffer.vksLocal.vkBuffer, 0, VK_INDEX_TYPE_UINT32);
  }

  drawArrays(offset, length) {
    let { vkCommandBuffer } = this;

    vkCmdDraw(vkCommandBuffer, length, 1, offset, 0);
  }

  drawIndexed(offset, length) {
    let { vkCommandBuffer } = this;

    vkCmdDrawIndexed(vkCommandBuffer, length, 1, offset, 0, 0);
  }

  endRender() {
    let { vkCommandBuffer } = this;

    vkCmdEndRenderPass(vkCommandBuffer);
  }
  end() {
    let { vkCommandBuffer } = this;

    let result = vkEndCommandBuffer(vkCommandBuffer);
    assertVulkan(result);
  }

  bindComputePipeline(pipeline) {
    let { vkCommandBuffer } = this;

    vkCmdBindPipeline(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.vkPipeline);

    if (pipeline.layout.enabled)
      vkCmdBindDescriptorSets(vkCommandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline.layout.vkPipelineLayout, 0, 1, [pipeline.layout.vkSet], 0, null);
  }

  dispatch(x = 1, y = 1, z = 1) {
    let { vkCommandBuffer } = this;

    vkCmdDispatch(vkCommandBuffer, x | 0, y | 0, z | 0);
  }

  copyBuffer(src, srcOffset, dst, dstOffset, length) {
    let { vkCommandBuffer } = this;

    let bufferCopy = new VkBufferCopy();
    bufferCopy.srcOffset = srcOffset;
    bufferCopy.dstOffset = dstOffset;
    bufferCopy.size = length;

    vkCmdCopyBuffer(vkCommandBuffer, src.vksLocal.vkBuffer, dst.vksLocal.vkBuffer, 1, [bufferCopy]);
  }
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
    assertVulkan(result);
  
    this.waitForFence(fence, 60 * 1E3);
    this.destroyFence(fence);
  }
  else {
    let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
    assertVulkan(result);
  }

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