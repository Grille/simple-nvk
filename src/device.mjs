import nvk from "nvk";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"
import * as enums from "./snvk-enum.mjs";

import Handle from "./handles/handle.mjs";
import BufferHandle from "./handles/buffer.mjs";
import CommandBufferHandle from "./handles/command.mjs";
import ComputePipelineHandle from "./handles/compute-pipeline.mjs";
import FenceHandle from "./handles/fence.mjs";
import FramebufferHandle from "./handles/framebuffer.mjs";
import ImageViewHandle from "./handles/image-view.mjs";
import PipelineLayoutHandle from "./handles/pipeline-layout.mjs";
import RenderPassHandle from "./handles/render-pass.mjs";
import RenderPipelineHandle from "./handles/render-pipeline.mjs";
import SemaphoreHandle from "./handles/semaphore.mjs";
import ShaderHandle from "./handles/shader.mjs";
import SurfaceHandle from "./handles/surface.mjs";
import SwapchainHandle from "./handles/swapchain.mjs";

export default class DeviceHandle extends Handle{
  constructor(owner){
    super(owner)
    this.id=-1;
    this.instance = owner.instance;
    this.commandPool = owner.commandPool;

    this.renderQueue = null;
    this.renderPool = null;

    this.transferQueue = null;
    this.transferPool = null;

    this.computeQueue = null;
    this.computePool = null;

    this.stagingQueue = null;
    this.stagingPool = null;

    let result = 0;

    this.physicalDevice = this.getPhysicalDevice();
    this.queueFamily = this.getQueueFamilyIndex(this.physicalDevice);

    let deviceQueueInfo = new VkDeviceQueueCreateInfo();
    deviceQueueInfo.queueFamilyIndex = 0;
    deviceQueueInfo.queueCount = 1;
    deviceQueueInfo.pQueuePriorities = new Float32Array([1]);
  
    let transferQueueInfo = new VkDeviceQueueCreateInfo();
    transferQueueInfo.queueFamilyIndex = 1;
    transferQueueInfo.queueCount = 1;
    transferQueueInfo.pQueuePriorities = new Float32Array([1]);

    let computeQueueInfo = new VkDeviceQueueCreateInfo();
    computeQueueInfo.queueFamilyIndex = 2;
    computeQueueInfo.queueCount = 1;
    computeQueueInfo.pQueuePriorities = new Float32Array([1]);

    let usedFeatures = new VkPhysicalDeviceFeatures();
    usedFeatures.wideLines = true;
    usedFeatures.fillModeNonSolid = true;
    usedFeatures.largePoints = true;
  
    let queueCreateInfos = [deviceQueueInfo, transferQueueInfo, computeQueueInfo];
    let deviceExtensions = [VK_KHR_SWAPCHAIN_EXTENSION_NAME]
    let deviceCreateInfo = new VkDeviceCreateInfo();
    deviceCreateInfo.queueCreateInfoCount = queueCreateInfos.length;
    deviceCreateInfo.pQueueCreateInfos = queueCreateInfos;
    deviceCreateInfo.pEnabledFeatures = usedFeatures;
    deviceCreateInfo.enabledExtensionCount = deviceExtensions.length;
    deviceCreateInfo.ppEnabledExtensionNames = deviceExtensions;
  
    this.device = new VkDevice();
    result = vkCreateDevice(this.physicalDevice, deviceCreateInfo, null, this.device);
    assertVulkan(result);



    this.commandPool = createVkCommandPool(this.device, 0);
    this.queue = this.getQueue(0);

    this.transferPool = createVkCommandPool(this.device, 1);
    this.transferQueue = this.getQueue(1);

    this.computePool = createVkCommandPool(this.device, 2);
    this.computeQueue = this.getQueue(2);
  }

  destroy() {
    this.super_destroy();
    vkDestroyCommandPool(this.device, this.commandPool, null);
    vkDestroyCommandPool(this.device, this.transferPool, null);
    vkDestroyCommandPool(this.device, this.computePool, null);
    vkDestroyDevice(this.device, null);
  }

  waitIdle(){
    vkDeviceWaitIdle(this.device);
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
    let { commandBuffer, waitSemaphore = null, signalSemaphore = null, signalFence = {}, blocking = false} = submitInfo;
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

    let queue = null;
    switch (commandBuffer.queue) {
      case enums.COMMAND_QUEUE_COMPUTE: queue = this.computeQueue; break;
      case enums.COMMAND_QUEUE_TRANSFER: queue = this.transferQueue; break;
      default: queue = this.queue; break;
    }

    if (blocking) {
      let fence = this.createFence();
    
      let result = vkQueueSubmit(queue, 1, [vkSubmitInfo], fence.vkFence);
      assertVulkan(result);
      fence.wait(60 * 1E3);
      fence.destroy();
    }
    else {
      let result = vkQueueSubmit(queue, 1, [vkSubmitInfo], vkFence);
      assertVulkan(result);
    }
  }

  createViewport(snvk) {
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

  getPhysicalDevice() {
    let physDevicesCount = { $: 0 };
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, null);
    let physDevices = new InitializedArray(VkPhysicalDevice, physDevicesCount.$);
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, physDevices);
  
    let physicalDevice = physDevices[0];
    let properties = new VkPhysicalDeviceProperties();
    vkGetPhysicalDeviceProperties(physicalDevice, properties)
    console.log("\nname: " + properties.deviceName);
    let ver = properties.apiVersion
    console.log("vAPI: " + VK_VERSION_MAJOR(ver) + "." + VK_VERSION_MINOR(ver) + "." + VK_VERSION_PATCH(ver));
  
    return physicalDevice; //TODO
  }
  
  getQueueFamilyIndex(physicalDevice) {
    let queueFamilysCount = { $: 0 }
    vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, queueFamilysCount, null);
    let queueFamilys = new InitializedArray(VkQueueFamilyProperties, queueFamilysCount.$)
    vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, queueFamilysCount, queueFamilys);
  /*
    for (let i = 0; i < queueFamilysCount.$; i++) {
      let queue = queueFamilys[i];
      console.log("queue <" + i + ">");
      console.log("count       : " + queue.queueCount);
      console.log("graphic  bit: " + ((queue.queueFlags & VK_QUEUE_GRAPHICS_BIT) ? "true" : "false"));
      console.log("compute  bit: " + ((queue.queueFlags & VK_QUEUE_COMPUTE_BIT) ? "true" : "false"));
      console.log("transfer bit: " + ((queue.queueFlags & VK_QUEUE_TRANSFER_BIT) ? "true" : "false"));
    }
  */
    return 0;
  }
  
  getQueue(queueFamily) {
    let queue = new VkQueue();
    vkGetDeviceQueue(this.device, queueFamily, 0, queue);
    return queue;
  }
}

function createVkCommandPool(device, queueFamily) {
  let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
  commandPoolCreateInfo.queueFamilyIndex = queueFamily;

  let commandPool = new VkCommandPool();
  let result = vkCreateCommandPool(device, commandPoolCreateInfo, null, commandPool);
  assertVulkan(result);

  return commandPool;
}