import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"

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
export let semaphores = {
  imageAviable: null,
  renderingDone: null,
}
export let shaderSrcCache = {};
export let vulkanReady = false;
export let pipelineInputChanged = false;

export let queueFamily = 0;

export function log(text) {
  console.log(text);
}

export function startWindow(obj) {
  this.window = new VulkanWindow(obj);
}

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
  this.assertVulkan(result);

  let semaphoreCreateInfo = new VkSemaphoreCreateInfo();
  this.semaphores.imageAviable = new VkSemaphore();
  this.semaphores.renderingDone = new VkSemaphore();
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.imageAviable);
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.renderingDone);

  this.log("vulkan started stage 1");
}

export function startPipeline() {
  this.surface = this.getSurface(this.physicalDevice);
  
  this.createSwapchain();

  let viewport = this.createViewport();

  let shaderInputInfo = this.createShaderInput();
  let bufferInputInfo = this.createBufferInput();
  this.createPipeline(bufferInputInfo, shaderInputInfo, viewport);

  this.framebuffers = new InitializedArray(VkFramebuffer, this.swapImageViews.length);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    let framebufferCreateInfo = new VkFramebufferCreateInfo();
    framebufferCreateInfo.renderPass = this.renderPass;
    framebufferCreateInfo.attachmentCount = 1;
    framebufferCreateInfo.pAttachments = [this.swapImageViews[i]];
    framebufferCreateInfo.width = this.window.width;
    framebufferCreateInfo.height = this.window.height;
    framebufferCreateInfo.layers = 1;

    let result = vkCreateFramebuffer(this.device, framebufferCreateInfo, null, this.framebuffers[i]);
    this.assertVulkan(result);
  }

  this.createCommand(this.queueFamily);

  this.vulkanReady = true;

  this.log("vulkan started stage 2");
}

export function drawFrame() {
  if (!this.vulkanReady) return;

  let imageIndex = { $: 0 };
  vkAcquireNextImageKHR(this.device, this.swapchain, 1E5, this.semaphores.imageAviable, null, imageIndex);

  let submitInfo = new VkSubmitInfo();
  submitInfo.waitSemaphoreCount = 1;
  submitInfo.pWaitSemaphores = [this.semaphores.imageAviable];
  submitInfo.pWaitDstStageMask = new Int32Array([VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT]);
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [this.commandBuffers[imageIndex.$]];
  submitInfo.signalSemaphoreCount = 1;
  submitInfo.pSignalSemaphores = [this.semaphores.renderingDone];

  vkQueueSubmit(this.queue, 1, [submitInfo], null);

  let presentInfoKHR = new VkPresentInfoKHR();
  presentInfoKHR.waitSemaphoreCount = 1;
  presentInfoKHR.pWaitSemaphores = [this.semaphores.renderingDone];
  presentInfoKHR.swapchainCount = 1;
  presentInfoKHR.pSwapchains = [this.swapchain];
  presentInfoKHR.pImageIndices = new Uint32Array([imageIndex.$]);
  presentInfoKHR.pResults = null;

  vkQueuePresentKHR(this.queue, presentInfoKHR);
}