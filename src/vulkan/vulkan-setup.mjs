import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"

export function createInstance() {
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
  this.assertVulkan(result);
}

export function getSurface(physicalDevice) {
  this.surface = new VkSurfaceKHR();
  if (this.window.createSurface(this.instance, null, this.surface) !== 0)
    console.error("createSurface failed");

  let surfaceSupport = { $: false };
  vkGetPhysicalDeviceSurfaceSupportKHR(physicalDevice, 0, this.surface, surfaceSupport);
  console.log("\nsurfaceSupport: " + (surfaceSupport.$ === 1));

  let surfaceCapabilities = new VkSurfaceCapabilitiesKHR()
  vkGetPhysicalDeviceSurfaceCapabilitiesKHR(physicalDevice, this.surface, surfaceCapabilities);

  let surfaceFormatCount = { $: 0 };
  vkGetPhysicalDeviceSurfaceFormatsKHR(physicalDevice, this.surface, surfaceFormatCount, null);
  let surfaceFormats = new InitializedArray(VkSurfaceFormatKHR, surfaceFormatCount.$);
  vkGetPhysicalDeviceSurfaceFormatsKHR(physicalDevice, this.surface, surfaceFormatCount, surfaceFormats);
  console.log("\nsurfaceFormats count: " + surfaceFormats.length);
  for (let i = 0; i < surfaceFormats.length; i++)
    console.log("format: " + surfaceFormats[i].format);
  return this.surface;
}



export function getPhysicalDevice() {
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

export function getQueueFamilyIndex(physicalDevice) {
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

export function getLogicalDevice(physicalDevice, queueFamily) {
  let deviceQueueInfo = new VkDeviceQueueCreateInfo();
  deviceQueueInfo.queueFamilyIndex = queueFamily;
  deviceQueueInfo.queueCount = 1;
  deviceQueueInfo.pQueuePriorities = new Float32Array([1, 1, 1, 1]);

  let usedFeatures = new VkPhysicalDeviceFeatures();

  let deviceExtensions = [VK_KHR_SWAPCHAIN_EXTENSION_NAME]
  let deviceCreateInfo = new VkDeviceCreateInfo();
  deviceCreateInfo.queueCreateInfoCount = 1;
  deviceCreateInfo.pQueueCreateInfos = [deviceQueueInfo];
  deviceCreateInfo.pEnabledFeatures = usedFeatures;
  deviceCreateInfo.enabledExtensionCount = deviceExtensions.length;
  deviceCreateInfo.ppEnabledExtensionNames = deviceExtensions;


  let device = new VkDevice();
  let result = vkCreateDevice(physicalDevice, deviceCreateInfo, null, device);
  this.assertVulkan(result);

  return device;
}

export function getQueue(queueFamily) {
  this.queue = new VkQueue();
  vkGetDeviceQueue(this.device, queueFamily, 0, this.queue);
  return this.queue;
}