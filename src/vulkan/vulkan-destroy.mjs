import nvk from "nvk"

Object.assign(global, nvk);

function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

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
export function destroySwapchain(){
  vkDeviceWaitIdle(this.device);
}

export function shutdownVulkan() {
  this.vulkanReady = false;

  vkDeviceWaitIdle(this.device);

  vkFreeCommandBuffers(this.device, this.commandPool, this.commandBuffers.length, this.commandBuffers);
  vkDestroyCommandPool(this.device, this.commandPool, null);

  destroyArray(this.device, this.framebuffers, vkDestroyFramebuffer);

  destroyHandles(this.bufferHandles, (a) => this.destroyBuffer(a));

  vkDestroyPipeline(this.device, this.pipeline, null);
  vkDestroyRenderPass(this.device, this.renderPass, null);

  destroyArray(this.device, this.swapImageViews, vkDestroyImageView);

  vkDestroyPipelineLayout(this.device, this.pipelineLayout, null);

  destroyArray(this.device, this.shaderModules, vkDestroyShaderModule);

  vkDestroySwapchainKHR(this.device, this.swapchain, null);



  vkDestroySurfaceKHR(this.instance, this.surface, null);

  destroyObject(this.device, this.semaphores, vkDestroySemaphore);

  vkDestroyDevice(this.device, null);
  vkDestroyInstance(this.instance, null);

  //this.log("vulkan destroyed");
}