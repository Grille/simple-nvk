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

  destroyHandles(this.fenceHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.semaphoreHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.framebufferHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.imageViewHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.swapchainHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.surfaceHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.renderPassHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.commandBufferHandles, (a) => this.destroyHandle(a));

  destroyHandles(this.renderPipelineHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.computePipelineHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.pipelineLayoutHandles, (a) => this.destroyHandle(a));

  destroyHandles(this.bufferHandles, (a) => this.destroyHandle(a));
  destroyHandles(this.shaderHandles, (a) => this.destroyHandle(a));

  vkDestroyCommandPool(this.device, this.commandPool, null);
  vkDestroyDevice(this.device, null);
  vkDestroyInstance(this.instance, null);
}