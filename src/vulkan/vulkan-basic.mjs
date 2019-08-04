import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"
Object.assign(global, nvk);

function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

export let instance = null;
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

export function log(text) {
  console.log(text);
}

export function startWindow(obj) {
  this.window = new VulkanWindow(obj);
}


export function startVulkan() {

  let result = 0;

  this.createInstance();

  let physicalDevice = this.getPhysicalDevice();
  let queueFamily = this.getQueueFamilyIndex(physicalDevice);

  this.device = this.getLogicalDevice(physicalDevice, queueFamily);
  this.queue = this.getQueue(queueFamily);
  this.surface = this.getSurface(physicalDevice);

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

  let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
  commandPoolCreateInfo.queueFamilyIndex = queueFamily;

  this.commandPool = new VkCommandPool();
  result = vkCreateCommandPool(this.device, commandPoolCreateInfo, null, this.commandPool);
  ASSERT_VK_RESULT(result);

  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = this.swapImageViews.length;

  this.commandBuffers = new InitializedArray(VkCommandBuffer, this.swapImageViews.length);
  result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, this.commandBuffers);
  ASSERT_VK_RESULT(result);

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  for (let i = 0; i < this.swapImageViews.length; i++) {
    let cmdBuffer = this.commandBuffers[i];
    result = vkBeginCommandBuffer(cmdBuffer, commandBufferBeginInfo);
    ASSERT_VK_RESULT(result);

    let renderPassBeginInfo = new VkRenderPassBeginInfo();
    renderPassBeginInfo.renderPass = this.renderPass;
    renderPassBeginInfo.framebuffer = this.framebuffers[i];
    renderPassBeginInfo.renderArea.offset.x = 0;
    renderPassBeginInfo.renderArea.offset.y = 0;
    renderPassBeginInfo.renderArea.extent.width = this.window.width;
    renderPassBeginInfo.renderArea.extent.height = this.window.height;
    renderPassBeginInfo.clearValueCount = 1;
    renderPassBeginInfo.pClearValues = [new VkClearValue({
      color: new VkClearColorValue({
        float32: [0, 0, 0.5, 1],
      }),
      depthStencil: null,
    })],


      vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE)

    vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, this.pipeline);

    vkCmdDraw(cmdBuffer, 3, 1, 0, 0);

    vkCmdEndRenderPass(cmdBuffer);

    result = vkEndCommandBuffer(cmdBuffer);
    ASSERT_VK_RESULT(result);
  }


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