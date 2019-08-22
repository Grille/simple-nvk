import nvk from "nvk"

function destroy(arg0=null,arg1=null,func){
  if (arg0 !== null && arg1 !== null);
  func(arg0, arg1, null);
}
function destroyHandles(handles, func) {
  for (let i = 0; i < handles.length; i++) {
    let handle = handles[i];
    if (handle !== null && handle.id !== -1) {
      func(handle);
    }
  }
  handles.length = 0;
}
function destroyObject(arg0, obj, func) {
  for (let key in obj) {
    if (obj[key] !== null) {
      func(arg0, obj[key], null);
      obj[key] = null;
    }
  };
}
function destroyArray(arg0, array, func) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== null) {
      func(arg0, array[i], null);
      array[i] = null;
    }
  }
}
export function waitIdle(){
  vkDeviceWaitIdle(this.device);
}

export function shutdownVulkan() {
  vkDeviceWaitIdle(this.device);



  destroyHandles(this.framebufferHandles, (a) => this.destroyFramebuffer(a));
  destroyHandles(this.imageViewHandles, (a) => this.destroyImageView(a));
  destroyHandles(this.swapchainHandles, (a) => this.destroySwapchain(a));
  destroyHandles(this.surfaceHandles, (a) => this.destroySurface(a));
  destroyHandles(this.renderPassHandles, (a) => this.destroyRenderPass(a));

  destroyHandles(this.renderPipelineHandles, (a) => this.destroyRenderPipeline(a));
  destroyHandles(this.computePipelineHandles, (a) => this.destroyComputePipeline(a));

  destroy(this.device, this.commandPool, vkDestroyCommandPool);
  this.commandPool = null;
  
  destroyHandles(this.bufferHandles, (a) => this.destroyBuffer(a));
  destroyHandles(this.shaderHandles, (a) => this.destroyShader(a));

  destroyObject(this.device, this.semaphores, vkDestroySemaphore);

  vkDestroyDevice(this.device, null);
  vkDestroyInstance(this.instance, null);
}