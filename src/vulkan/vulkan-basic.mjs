import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"
Object.assign(global, nvk);

function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

export let instance = null;
export let physicalDevice = null;
export let device = null;
export let window = null;
export let surface = null;
export let swapchain = null;
export let swapImageViews = [];
export let shaderModules = [];
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

export function log(text) {
  console.log(text);
}

export function startWindow(obj) {
  this.window = new VulkanWindow(obj);
}

let vertexPos = new Float32Array([
  0.0, -0.5,
  0.5, 0.5,
  0.0, 0.5,
])
let vertexColor = new Float32Array([
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
])

export function startVulkan() {

  let result = 0;

  this.createInstance();

  this.physicalDevice = this.getPhysicalDevice();
  let queueFamily = this.getQueueFamilyIndex(this.physicalDevice);

  this.device = this.getLogicalDevice(this.physicalDevice, queueFamily);
  this.queue = this.getQueue(queueFamily);
  this.surface = this.getSurface(this.physicalDevice);

  this.createSwapchain();

  let shaderVert = this.loadShaderSrc(`./src/shader/shader.vert`, `vert`);
  let shaderFrag = this.loadShaderSrc(`./src/shader/shader.frag`, `frag`);

  let shaderModuleVert = this.createShaderModule(shaderVert);
  let shaderModuleFrag = this.createShaderModule(shaderFrag);

  let shaderStageCreateInfoVert = new VkPipelineShaderStageCreateInfo();
  shaderStageCreateInfoVert.stage = VK_SHADER_STAGE_VERTEX_BIT;
  shaderStageCreateInfoVert.module = shaderModuleVert;
  shaderStageCreateInfoVert.pName = "main";
  shaderStageCreateInfoVert.pSpecializationInfo = null;

  let shaderStageCreateInfoFrag = new VkPipelineShaderStageCreateInfo();
  shaderStageCreateInfoFrag.stage = VK_SHADER_STAGE_FRAGMENT_BIT;
  shaderStageCreateInfoFrag.module = shaderModuleFrag;
  shaderStageCreateInfoFrag.pName = "main";
  shaderStageCreateInfoFrag.pSpecializationInfo = null;

  let shaderStageInfos = [
    shaderStageCreateInfoVert,
    shaderStageCreateInfoFrag,
  ]

  //let buffer = this.createBuffer();
  let viewport = this.createViewport();
  let inputInfo = this.createInput();
  this.createPipeline(shaderStageInfos, viewport, inputInfo);

  this.framebuffers = new InitializedArray(VkFramebuffer, this.swapImageViews.length);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    let framebufferCreateInfo = new VkFramebufferCreateInfo();
    framebufferCreateInfo.renderPass = this.renderPass;
    framebufferCreateInfo.attachmentCount = 1;
    framebufferCreateInfo.pAttachments = [this.swapImageViews[i]];
    framebufferCreateInfo.width = this.window.width;
    framebufferCreateInfo.height = this.window.height;
    framebufferCreateInfo.layers = 1;

    result = vkCreateFramebuffer(this.device, framebufferCreateInfo, null, this.framebuffers[i]);
    ASSERT_VK_RESULT(result);
  }

  this.createCommand(queueFamily);

  let semaphoreCreateInfo = new VkSemaphoreCreateInfo();
  this.semaphores.imageAviable = new VkSemaphore();
  this.semaphores.renderingDone = new VkSemaphore();
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.imageAviable);
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.renderingDone);

  this.vulkanReady = true;
  this.log("vulkan started");
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