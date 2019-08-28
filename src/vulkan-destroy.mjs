import nvk from "nvk"

function destroyHandles(handles, func) {
  for (let i = 0; i < handles.length; i++) {
    let handle = handles[i];
    if (handle !== null && handle.id !== -1) {
      func(handle);
    }
  }
  handles.length = 0;
}

export function shutdownVulkan() {
  vkDeviceWaitIdle(this.device);

  destroyHandles(this.fenceHandles, (a) => this.destroyFence(a));
  destroyHandles(this.semaphoreHandles, (a) => this.destroySemaphore(a));
  destroyHandles(this.framebufferHandles, (a) => this.destroyFramebuffer(a));
  destroyHandles(this.imageViewHandles, (a) => this.destroyImageView(a));
  destroyHandles(this.swapchainHandles, (a) => this.destroySwapchain(a));
  destroyHandles(this.surfaceHandles, (a) => this.destroySurface(a));
  destroyHandles(this.renderPassHandles, (a) => this.destroyRenderPass(a));
  destroyHandles(this.commandBufferHandles, (a) => this.destroyCommandBuffer(a));

  destroyHandles(this.renderPipelineHandles, (a) => this.destroyRenderPipeline(a));
  destroyHandles(this.computePipelineHandles, (a) => this.destroyComputePipeline(a));
  destroyHandles(this.pipelineLayoutHandles, (a) => this.destroyPipelineLayout(a));

  destroyHandles(this.bufferHandles, (a) => this.destroyBuffer(a));
  destroyHandles(this.shaderHandles, (a) => this.destroyShader(a));

  vkDestroyCommandPool(this.device, this.commandPool, null);
  vkDestroyDevice(this.device, null);
  vkDestroyInstance(this.instance, null);
}