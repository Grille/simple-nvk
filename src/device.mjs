import Handle from "./handles/handle.mjs";

export default class DeviceHandle extends Handle{
  constructor(snvk){
    this.id=-1;
    this.snvk = snvk;
    this.device = snvk.device;
    this.physicalDevice = snvk.physicalDevice;

    this.queue;

    this.bufferHandles = [];
  }
  destroy() {
    throw new Error("destroy not implemented");
  }

  createBuffer(createInfo) {
    return new BufferHandle(this, createInfo)
  }
  destroyBuffer(handle) {
    handle.destroy();
  }
  createCommandBuffer(createInfo) {
    return new CommandBufferHandle(this, createInfo);
  }
  
  destroyCommandBuffer(handle) {
    handle.destroy();
  }




  submit(submitInfo) {
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
      fence.wait(60 * 1E3);
      this.destroyFence(fence);
    }
    else {
      let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
      assertVulkan(result);
    }
  
  }

}