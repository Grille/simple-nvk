import Handle from "./handles/handle.mjs";

export default class DeviceHandle extends Handle{
  constructor(snvk){
    this.id=-1;
    this.snvk = snvk;
    this.device = snvk.device;
    this.physicalDevice = snvk.physicalDevice;
    this.queue;
  }

  destroy() {
    this.super_destroy();
    throw new Error("destroy not implemented");
  }

  createBuffer(createInfo) { return this.create(BufferHandle, createInfo); }

  createCommandBuffer(createInfo) { return this.create(CommandBufferHandle, createInfo); }

  createComputePipeline(createInfo) { return this.create(ComputePipelineHandle, createInfo); }

  createFence(createInfo) { return this.create(FenceHandle, createInfo); }

  createFramebuffer(createInfo) { return this.create(FramebufferHandle, createInfo); }

  createImageView(createInfo) { return this.create(ImageViewHandle, createInfo); }

  createPipelineLayout(createInfo) { return this.create(PipelineLayoutHandle, createInfo); }

  createRenderPass(createInfo) { return this.create(RenderPassHandle, createInfo); }

  createRenderPipeline(createInfo) { return this.create(RenderPipelineHandle, createInfo); }

  createSemaphore(createInfo) { return this.create(SemaphoreHandle, createInfo); }

  createShader(createInfo) { return this.create(ShaderHandle, createInfo); }

  createSurface(createInfo) { return this.create(SurfaceHandle, createInfo); }

  createSwapchain(createInfo) { return this.create(SwapchainHandle, createInfo); }

  create(Type, createInfo) {
    let handle = new Type(this, createInfo);
    pushHandle(this, handle);
    return handle;
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