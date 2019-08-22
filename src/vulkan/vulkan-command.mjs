import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"

export function createCommand(createInfo) {
  let { swapchain, pipeline,framebuffers,buffers,indexBuffer } = createInfo;

  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = swapchain.imageCount;

  this.commandBuffers = new InitializedArray(VkCommandBuffer, swapchain.imageCount);
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, this.commandBuffers);
  this.assertVulkan(result);

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  for (let i = 0; i < swapchain.imageCount; i++) {
    let cmdBuffer = this.commandBuffers[i];
    result = vkBeginCommandBuffer(cmdBuffer, commandBufferBeginInfo);
    this.assertVulkan(result);

    let renderPassBeginInfo = new VkRenderPassBeginInfo();
    renderPassBeginInfo.renderPass = pipeline.vkRenderPass;
    renderPassBeginInfo.framebuffer = framebuffers[i].vkFramebuffer;
    renderPassBeginInfo.renderArea.offset.x = 0;
    renderPassBeginInfo.renderArea.offset.y = 0;
    renderPassBeginInfo.renderArea.extent.width = swapchain.width;
    renderPassBeginInfo.renderArea.extent.height = swapchain.height;
    renderPassBeginInfo.clearValueCount = 1;
    renderPassBeginInfo.pClearValues = [new VkClearValue({
      color: new VkClearColorValue({
        float32: [0, 0, 0.5, 1],
      }),
      depthStencil: null,
    })];


    vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

    vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);


    let viewport = new VkViewport();
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = swapchain.width;
    viewport.height = swapchain.height;
    viewport.minDepth = 0;
    viewport.maxDepth = 1;

    let scissor = new VkRect2D();
    scissor.offset.x = 0;
    scissor.offset.y = 0;
    scissor.extent.width = swapchain.width;
    scissor.extent.height = swapchain.height;

    vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);

    vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);


    let offsets = new BigUint64Array([0n, 0n]);
    let vertexBuffers = [];
    let id = 0;
    let length = 0;

    for (let i = 0; i < buffers.length; i++) {
      let handle = buffers[i];
      if (handle !== null && handle.id !== -1 && handle.location !== -1) {
        vertexBuffers[id] = handle.vksLocal.vkBuffer;
        length = handle.length;
        id += 1;
      }
    }

    console.log(vertexBuffers.length);

    vkCmdBindVertexBuffers(cmdBuffer, 0, vertexBuffers.length, vertexBuffers, offsets);
    vkCmdBindIndexBuffer(cmdBuffer, indexBuffer.vksLocal.vkBuffer, 0, VK_INDEX_TYPE_UINT32);

    vkCmdDrawIndexed(cmdBuffer, 6, 1, 0, 0, 0);
    //vkCmdDraw(cmdBuffer, length, 1, 0, 0);

    vkCmdEndRenderPass(cmdBuffer);

    result = vkEndCommandBuffer(cmdBuffer);
    this.assertVulkan(result);
  }
}

export function drawIndexed(pipeline,framebuffer){

}