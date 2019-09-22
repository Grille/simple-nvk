import nvk from "nvk";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"

import * as enums from "./snvk-enum.mjs";
import DeviceHandle from "./device.mjs";

export default class SNVK {
  constructor() {
    Object.assign(this, enums);

    this.instance = null;
    this.physicalDevice = null;
    this.device = null;
    this.window = null;
    this.surface = null;
    this.commandPool = null;

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

  createDevice(createInfo) {
    return this.dh = new DeviceHandle(this, createInfo);
  }

  shutdown() {
    this.dh.destroy();

    vkDeviceWaitIdle(this.device);

    vkDestroyCommandPool(this.device, this.commandPool, null);
    vkDestroyDevice(this.device, null);
    vkDestroyInstance(this.instance, null);
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