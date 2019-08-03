import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"

Object.assign(global, nvk);

export default class Engine {
  constructor() {
    this.instance = null;
    this.device = null;
    this.window = null;
    this.surface = null;
    this.swapchain = null;
    this.imageViews = [];
  }
}

Engine.prototype.assertVulkan = function (code) {
  if (code !== VK_SUCCESS)
    console.error("vulkan error");
}
Engine.prototype.startVulkan = function () {
  this.instance = new VkInstance();
  this.window = new VulkanWindow({ width: 480, height: 320, title: "NVK Mandelbrot" });
  this.surface = new VkSurfaceKHR();

  let validationLayers = ["VK_LAYER_LUNARG_standard_validation"]
  let extensions = [...this.window.getRequiredInstanceExtensions()];
  let result = 0;
  /*
  for (let key in this.window) {
      console.log(key);
  };*/

  let appInfo = new VkApplicationInfo({
    pApplicationName: "NVK Mandelbrot",
    applicationVersion: VK_MAKE_VERSION(1, 0, 0),
    pEngineName: "engine",
    engineVersion: VK_MAKE_VERSION(1, 0, 0),
    apiVersion: VK_API_VERSION_1_0,
  });

  let instanceInfo = new VkInstanceCreateInfo({
    pApplicationinfo: appInfo,
    enabledLayerCount: validationLayers.length,
    ppEnabledLayerNames: validationLayers,
    enabledExtensionCount: extensions.length,
    ppEnabledExtensionNames: extensions,
  });


  if (vkCreateInstance(instanceInfo, null, this.instance) !== VK_SUCCESS)
    console.error("vkCreateInstance failed");
  //vkGetInstanceProcAddr(instance,"vkk_surface");

  if (this.window.createSurface(this.instance, null, this.surface) !== 0)
    console.error("createSurface failed");

  let physDevicesCount = { $: 0 };
  vkEnumeratePhysicalDevices(this.instance, physDevicesCount, null);
  let physDevices = new InitializedArray(VkPhysicalDevice, physDevicesCount.$);
  vkEnumeratePhysicalDevices(this.instance, physDevicesCount, physDevices);
  let physicalDevice = physDevices[0]; //TODO

  let properties = new VkPhysicalDeviceProperties();
  vkGetPhysicalDeviceProperties(physicalDevice, properties)
  console.log("\nname: " + properties.deviceName);
  let ver = properties.apiVersion
  console.log("vAPI: " + VK_VERSION_MAJOR(ver) + "." + VK_VERSION_MINOR(ver) + "." + VK_VERSION_PATCH(ver));

  let queueFamilysCount = { $: 0 }
  vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, queueFamilysCount, null);
  let queueFamilys = new InitializedArray(VkQueueFamilyProperties, queueFamilysCount.$)
  vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, queueFamilysCount, queueFamilys);

  for (let i = 0; i < queueFamilysCount.$; i++) {
    let queue = queueFamilys[i];
    console.log("queue <" + i + ">");
    console.log("count       : " + queue.queueCount);
    console.log("graphic  bit: " + ((queue.queueFlags & VK_QUEUE_GRAPHICS_BIT) ? "true" : "false"));
    console.log("compute  bit: " + ((queue.queueFlags & VK_QUEUE_COMPUTE_BIT) ? "true" : "false"));
    console.log("transfer bit: " + ((queue.queueFlags & VK_QUEUE_TRANSFER_BIT) ? "true" : "false"));
  }
  let queueFamily = 0;//TODO

  let deviceQueueInfo = new VkDeviceQueueCreateInfo({
    queueFamilyIndex: queueFamily,
    queueCount: 1,
    pQueuePriorities: new Float32Array([1, 1, 1, 1]),
  });


  let usedFeatures = new VkPhysicalDeviceFeatures({

  });
  let deviceExtensions = [VK_KHR_SWAPCHAIN_EXTENSION_NAME]
  let deviceCreateInfo = new VkDeviceCreateInfo({
    queueCreateInfoCount: 1,
    pQueueCreateInfos: [deviceQueueInfo],
    pEnabledFeatures: usedFeatures,
    enabledExtensionCount: deviceExtensions.length,
    ppEnabledExtensionNames: deviceExtensions,
  });

  this.device = new VkDevice();
  if (vkCreateDevice(physicalDevice, deviceCreateInfo, null, this.device) !== VK_SUCCESS)
    console.error("vkCreateDevice failed");

  let queue = new VkQueue();
  vkGetDeviceQueue(this.device, 0, 0, queue);

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

  let swapchainCreateInfo = new VkSwapchainCreateInfoKHR({
    surface: this.surface,
    minImageCount: 2,
    imageFormat: VK_FORMAT_B8G8R8A8_UNORM,
    imageColorSpace: VK_COLOR_SPACE_SRGB_NONLINEAR_KHR,
    imageExtent: new VkExtent2D({ width: 480, height: 320 }),
    imageArrayLayers: 1,
    imageUsage: VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT,
    imageSharingMode: VK_SHARING_MODE_EXCLUSIVE,
    queueFamilyIndexCount: 0,
    pQueueFamilyIndices: null,
    preTransform: VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR,
    compositeAlpha: VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR,
    presentMode: VK_PRESENT_MODE_FIFO_KHR,
    clipped: true,
    oldSwapchain: this.swapchain,
  });

  this.swapchain = new VkSwapchainKHR();
  vkCreateSwapchainKHR(this.device, swapchainCreateInfo, null, this.swapchain);

  let swapchainImageCount = { $: 0 };
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, null);
  let swapchainImages = new InitializedArray(VkImage, swapchainImageCount.$);
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, swapchainImages)
  
  this.imageViews = new InitializedArray(VkImageView, swapchainImageCount.$);
  for (let i = 0;i<this.imageViews.length;i++){
    let imageViewCreateInfo = new VkImageViewCreateInfo({
      image: swapchainImages[i],
      viewType: VK_IMAGE_VIEW_TYPE_2D,
      format: VK_FORMAT_B8G8R8A8_UNORM,
      components: new VkComponentMapping({
        r: VK_COMPONENT_SWIZZLE_IDENTITY,
        g: VK_COMPONENT_SWIZZLE_IDENTITY,
        b: VK_COMPONENT_SWIZZLE_IDENTITY,
        a: VK_COMPONENT_SWIZZLE_IDENTITY,
      }),
      subresourceRange: new VkImageSubresourceRange({
        aspectMask: VK_IMAGE_ASPECT_COLOR_BIT,
        baseMipLevel: 0,
        levelCount: 1,
        baseArrayLayer: 0,
        layerCount: 1,
      }),
    });
    vkCreateImageView(this.device, imageViewCreateInfo, null, this.imageViews[i]);
  }

}

Engine.prototype.shutdownVulkan = function () {
  vkDeviceWaitIdle(this.device);

  for (let i = 0; i < this.imageViews.length; i++) {
    vkDestroyImageView(this.device, this.imageViews[i], null);
  }
  vkDestroySwapchainKHR(this.device, this.swapchain, null);
  vkDestroyDevice(this.device, null);
  vkDestroySurfaceKHR(this.instance, this.surface, null);
  vkDestroyInstance(this.instance, null);
}