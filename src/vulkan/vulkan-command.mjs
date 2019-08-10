import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"
Object.assign(global, nvk);

export function createCommand(queueFamily) {
    let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
    commandPoolCreateInfo.queueFamilyIndex = queueFamily;

    let result = 0;

    this.commandPool = new VkCommandPool();
    result = vkCreateCommandPool(this.device, commandPoolCreateInfo, null, this.commandPool);
    this.assertVulkan(result);

    let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
    commandBufferAllocateInfo.commandPool = this.commandPool;
    commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
    commandBufferAllocateInfo.commandBufferCount = this.swapImageViews.length;

    this.commandBuffers = new InitializedArray(VkCommandBuffer, this.swapImageViews.length);
    result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, this.commandBuffers);
    this.assertVulkan(result);

    let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
    commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
    commandBufferBeginInfo.pInheritanceInfo = null;

    for (let i = 0; i < this.swapImageViews.length; i++) {
        let cmdBuffer = this.commandBuffers[i];
        result = vkBeginCommandBuffer(cmdBuffer, commandBufferBeginInfo);
        this.assertVulkan(result);

        let renderPassBeginInfo = new VkRenderPassBeginInfo();
        renderPassBeginInfo.renderPass = this.renderPass;
        renderPassBeginInfo.framebuffer = this.framebuffers[i];
        renderPassBeginInfo.renderArea.offset.x = 0;
        renderPassBeginInfo.renderArea.offset.y = 0;
        renderPassBeginInfo.renderArea.extent.width = this.window.width;
        renderPassBeginInfo.renderArea.extent.height = this.window.height;
        renderPassBeginInfo.clearValueCount = 1;
        renderPassBeginInfo.pClearValues = [new VkClearValue({
            color: new VkClearColorValue({
                float32: [0, 0, 0.5, 1],
            }),
            depthStencil: null,
        })];


        vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

        vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, this.pipeline);

        /*
        let viewport = new VkViewport();
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = this.window.width;
        viewport.height = this.window.height;
        viewport.minDepth = 0;
        viewport.maxDepth = 1;

        let scissor = new VkRect2D();
        scissor.offset.x = 0;
        scissor.offset.y = 0;
        scissor.extent.width = this.window.width;
        scissor.extent.height = this.window.height;

        vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);

        vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);
        */

        let offsets = new BigUint64Array([0n,0n]);
        let { bufferHandles } = this;
        let vertexBuffers = [];
        let id = 0;
        
        for (let i = 0; i < bufferHandles.length; i++) {
          let handle = bufferHandles[i];
          if (handle !== null && handle.id !== -1) {
            vertexBuffers[id] = handle.buffer;
            id += 1;
          }
        }

        vkCmdBindVertexBuffers(cmdBuffer, 0, vertexBuffers.length, vertexBuffers, offsets);

        vkCmdDraw(cmdBuffer, 3, 1, 0, 0);

        vkCmdEndRenderPass(cmdBuffer);

        result = vkEndCommandBuffer(cmdBuffer);
        this.assertVulkan(result);
    }
}