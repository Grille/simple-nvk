import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let commandbufferHandles = [];

export function createCommandbuffer() {
  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = 1;

  let commandbuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, [commandbuffer]);
  this.assertVulkan(result);

  let handle = {
    vkCommandbuffer: commandbuffer,
  }

  pushHandle(this.commandbufferHandles, handle);

  return handle;
}

export function destroyCommandbuffer(handle) {
  vkFreeCommandBuffers(this.device, this.commandPool, 1, [handle.vkCommandbuffer]);
  deleteHandle(this.commandbufferHandles, handle);
}

export function cmdBegin(commandbuffer) {
  let { vkCommandbuffer } = commandbuffer;

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  let result = vkBeginCommandBuffer(vkCommandbuffer, commandBufferBeginInfo);
  this.assertVulkan(result);
}

export function cmdBeginRender(commandbuffer, pipeline, frambuffer) {
  let { vkCommandbuffer } = commandbuffer;

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

  vkCmdBeginRenderPass(vkCommandbuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

  vkCmdBindPipeline(vkCommandbuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);

  let vertexBindings = pipeline.vertexBindings;
  let offsets = new BigUint64Array(vertexBindings.length);
  let vertexBuffers = [];
  let id = 0;
  let length = 0;

  for (let i = 0; i < vertexBindings.length; i++) {
    let handle = vertexBindings[i].buffer;
    if (handle !== null && handle.id !== -1 && handle.location !== -1) {
      vertexBuffers[id] = handle.vksLocal.vkBuffer;
      length = handle.length;
      id += 1;
    }
  }

  vkCmdBindVertexBuffers(vkCommandbuffer, 0, vertexBuffers.length, vertexBuffers, offsets);
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

export function cmdBindIndexBuffer(commandbuffer, indexBuffer) {
  let { vkCommandbuffer } = commandbuffer;

  vkCmdBindIndexBuffer(vkCommandbuffer, indexBuffer.vksLocal.vkBuffer, 0, VK_INDEX_TYPE_UINT32);
}
export function cmdDrawIndexed(commandbuffer) {
  let { vkCommandbuffer } = commandbuffer;

  vkCmdDrawIndexed(vkCommandbuffer, 6, 1, 0, 0, 0);
}

export function cmdEndRender(commandbuffer) {
  let { vkCommandbuffer } = commandbuffer;

  vkCmdEndRenderPass(vkCommandbuffer);
}
export function cmdEnd(commandbuffer) {
  let { vkCommandbuffer } = commandbuffer;

  let result = vkEndCommandBuffer(vkCommandbuffer);
  this.assertVulkan(result);
}
export function submit(commandbuffer) {
  let { vkCommandbuffer } = commandbuffer;

  let submitInfo = new VkSubmitInfo();
  submitInfo.waitSemaphoreCount = 1;
  submitInfo.pWaitSemaphores = [this.semaphores.imageAviable];
  submitInfo.pWaitDstStageMask = new Int32Array([VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT]);
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [vkCommandbuffer];
  submitInfo.signalSemaphoreCount = 1;
  submitInfo.pSignalSemaphores = [this.semaphores.renderingDone];

  vkQueueSubmit(this.queue, 1, [submitInfo], null);
}
