import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"

export let instance = null;
export let physicalDevice = null;
export let device = null;
export let window = null;
export let surface = null;
export let swapchain = null;
export let swapImageViews = [];
export let pipelineLayout = null;
export let renderPass = null;
export let pipeline = null;
export let framebuffers = [];
export let commandPool = null;
export let commandBuffers = [];
export let queue = null;

export let shaderSrcCache = {};
export let vulkanReady = false;
export let pipelineInputChanged = false;

export let queueFamily = 0;

export function startWindow(obj) {
  this.window = new VulkanWindow(obj);
}
export function closeWindow(){
  this.window.close();
};

export function startVulkan() {

  let result = 0;

  this.createInstance();

  this.physicalDevice = this.getPhysicalDevice();
  this.queueFamily = this.getQueueFamilyIndex(this.physicalDevice);

  this.device = this.getLogicalDevice(this.physicalDevice, this.queueFamily);
  this.queue = this.getQueue(this.queueFamily);

  let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
  commandPoolCreateInfo.queueFamilyIndex = this.queueFamily;

  this.commandPool = new VkCommandPool();
  result = vkCreateCommandPool(this.device, commandPoolCreateInfo, null, this.commandPool);
  assertVulkan(result);
}

export function createViewport(snvk) {
  let viewport = new VkViewport();
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = snvk.window.width;
  viewport.height = snvk.window.height;
  viewport.minDepth = 0;
  viewport.maxDepth = 1;

  let scissor = new VkRect2D();
  scissor.offset.x = 0;
  scissor.offset.y = 0;
  scissor.extent.width = snvk.window.width;
  scissor.extent.height = snvk.window.height;

  let viewportCreateInfo = new VkPipelineViewportStateCreateInfo();
  viewportCreateInfo.viewportCount = 1;
  viewportCreateInfo.pViewports = [viewport];
  viewportCreateInfo.scissorCount = 1;
  viewportCreateInfo.pScissors = [scissor];

  return viewportCreateInfo;
}

export function submit(submitInfo) {
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
    this.destroyHandle(fence);
  }
  else {
    let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
    assertVulkan(result);
  }

}
