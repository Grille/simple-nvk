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

export function shutdownPipeline() {
  this.vulkanReady = false;

  vkDeviceWaitIdle(this.device);

  vkFreeCommandBuffers(this.device, this.commandPool, this.commandBuffers.length, this.commandBuffers);

  destroyArray(this.device, this.framebuffers, vkDestroyFramebuffer);

  destroy(this.device, this.pipeline, vkDestroyPipeline);
  this.pipeline = null;
  
  destroy(this.device, this.renderPass, vkDestroyRenderPass);
  this.renderPass = null;

  destroy(this.device, this.pipelineLayout, vkDestroyPipelineLayout);
  this.pipelineLayout = null;

  destroyArray(this.device, this.swapImageViews, vkDestroyImageView);
  
  destroy(this.device, this.swapchain, vkDestroySwapchainKHR);
  this.swapchain = null;

  destroy(this.instance, this.surface, vkDestroySurfaceKHR);
  this.surface = null;

  this.log("vulkan destroyed stage 2");
}

export function shutdownVulkan() {
  vkDeviceWaitIdle(this.device);

  destroy(this.device, this.commandPool, vkDestroyCommandPool);
  this.commandPool = null;
  
  destroyHandles(this.bufferHandles, (a) => this.destroyBuffer(a));
  destroyHandles(this.shaderHandles, (a) => this.destroyShader(a));

  destroyObject(this.device, this.semaphores, vkDestroySemaphore);

  vkDestroyDevice(this.device, null);
  vkDestroyInstance(this.instance, null);

  this.log("vulkan destroyed stage 1");
}