import nvk from "nvk";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"

import * as enums from "./snvk-enum.mjs";

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
import DeviceHandle from "./device.mjs";
import Handle from "./handles/handle.mjs";

Object.assign(global, nvk);

export default class SNVK {
  constructor() {
    Object.assign(this, enums);

    this.instance = null;
    this.physicalDevice = null;
    this.device = null;
    this.window = null;
    this.surface = null;
    this.swapchain = null;
    this.swapImageViews = [];
    this.pipelineLayout = null;
    this.renderPass = null;
    this.pipeline = null;
    this.framebuffers = [];
    this.commandPool = null;
    this.commandBuffers = [];
    this.queue = null;

    this.shaderSrcCache = {};
    this.vulkanReady = false;
    this.pipelineInputChanged = false;

    this.queueFamily = 0;

    this.handles = [];

  }

  startWindow(obj) {
    this.window = new VulkanWindow(obj);
  }
  closeWindow() {
    this.window.close();
  };

  startVulkan() {

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

  createDevice(){
    return new DeviceHandle();
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

  submit(submitInfo) {
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
      fence.destroy();
    }
    else {
      let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
      assertVulkan(result);
    }

  }

  shutdownVulkan() {
    vkDeviceWaitIdle(this.device);

    destroyHandles(this.handles);

    vkDestroyCommandPool(this.device, this.commandPool, null);
    vkDestroyDevice(this.device, null);
    vkDestroyInstance(this.instance, null);
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

  createInstance() {
    let validationLayers = ["VK_LAYER_LUNARG_standard_validation", "VK_LAYER_LUNARG_parameter_validation"];
    let extensions = [...this.window.getRequiredInstanceExtensions()];
  
    let appInfo = new VkApplicationInfo();
    appInfo.pApplicationName = "NVK Mandelbrot";
    appInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.pEngineName = "engine";
    appInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.apiVersion = VK_API_VERSION_1_0;
  
    let instanceInfo = new VkInstanceCreateInfo();
    instanceInfo.pApplicationinfo = appInfo;
    instanceInfo.enabledLayerCount = validationLayers.length;
    instanceInfo.ppEnabledLayerNames = validationLayers;
    instanceInfo.enabledExtensionCount = extensions.length;
    instanceInfo.ppEnabledExtensionNames = extensions;
  
    this.instance = new VkInstance();
    let result = vkCreateInstance(instanceInfo, null, this.instance)
    assertVulkan(result);
  }
  
  getPhysicalDevice() {
    let physDevicesCount = { $: 0 };
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, null);
    let physDevices = new InitializedArray(VkPhysicalDevice, physDevicesCount.$);
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, physDevices);
  
    let physicalDevice = physDevices[0];
    let properties = new VkPhysicalDeviceProperties();
    vkGetPhysicalDeviceProperties(physicalDevice, properties)
    //console.log("\nname: " + properties.deviceName);
    let ver = properties.apiVersion
    //console.log("vAPI: " + VK_VERSION_MAJOR(ver) + "." + VK_VERSION_MINOR(ver) + "." + VK_VERSION_PATCH(ver));
  
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
  
  getLogicalDevice(physicalDevice, queueFamily) {
    let deviceQueueInfo = new VkDeviceQueueCreateInfo();
    deviceQueueInfo.queueFamilyIndex = queueFamily;
    deviceQueueInfo.queueCount = 1;
    deviceQueueInfo.pQueuePriorities = new Float32Array([1, 1, 1, 1]);
  
    let usedFeatures = new VkPhysicalDeviceFeatures();
    usedFeatures.wideLines = true;
    usedFeatures.fillModeNonSolid = true;
    usedFeatures.largePoints = true;
  
    let deviceExtensions = [VK_KHR_SWAPCHAIN_EXTENSION_NAME]
    let deviceCreateInfo = new VkDeviceCreateInfo();
    deviceCreateInfo.queueCreateInfoCount = 1;
    deviceCreateInfo.pQueueCreateInfos = [deviceQueueInfo];
    deviceCreateInfo.pEnabledFeatures = usedFeatures;
    deviceCreateInfo.enabledExtensionCount = deviceExtensions.length;
    deviceCreateInfo.ppEnabledExtensionNames = deviceExtensions;
  
  
    let device = new VkDevice();
    let result = vkCreateDevice(physicalDevice, deviceCreateInfo, null, device);
    assertVulkan(result);
  
    return device;
  }
  
  getQueue(queueFamily) {
    this.queue = new VkQueue();
    vkGetDeviceQueue(this.device, queueFamily, 0, this.queue);
    return this.queue;
  }
}

function destroyHandles(handles) {
  for (let i = handles.length - 1; i >= 0; i--) {
    let handle = handles[i];
    if (handle !== null && handle.id !== -1) {
      handle.destroy();
    }
  }
  handles.length = 0;
}