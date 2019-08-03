import fs from "fs"
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
    this.shaderModules = [];
    this.pipelineLayout = null;
  }
}

let assertVulkan = function (code) {
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

  let shaderVert = fs.readFileSync("./vert.spv");
  let shaderFrag = fs.readFileSync("./frag.spv");

  let shaderModuleVert = this.createShaderModule(shaderVert);
  let shaderModuleFrag = this.createShaderModule(shaderFrag);

  let shaderStageCreateInfoVert = new VkPipelineShaderStageCreateInfo({
    stage: VK_SHADER_STAGE_VERTEX_BIT,
    module: shaderModuleVert,
    pName: "main",
    pSpecializationInfo: null,
  });
  let shaderStageCreateInfoFrag = new VkPipelineShaderStageCreateInfo({
    stage: VK_SHADER_STAGE_FRAGMENT_BIT,
    module: shaderModuleFrag,
    pName: "main",
    pSpecializationInfo: null,
  });

  let shaderStageInfos = [
    shaderStageCreateInfoVert,
    shaderStageCreateInfoFrag,
  ]

  let vertexInputCreateInfo = new VkPipelineVertexInputStateCreateInfo({});

  let inputAssemblyCreateInfo = new VkPipelineInputAssemblyStateCreateInfo({
    topology: VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
    primitiveRestartEnabled: false,
  });

  let viewport = new VkViewport({
    x:0,
    y:0,
    width:480,
    height:320,
    minDepth:0,
    maxDepth:1,
  })

  let scissor = new VkRect2D({
    offset: new VkOffset2D({ x: 0, y: 0 }),
    extent: new VkExtent2D({ width: 480, height: 320 }),
  });

  let pipelineViewportCreateInfo = new VkPipelineViewportStateCreateInfo({
    viewportCount: 1,
    pViewport: [viewport],
    scissorCount: 1,
    pScissor: [scissor],
  });

  let rasterizationCreateInfo = new VkPipelineRasterizationStateCreateInfo({
    depthClampEnable:false,
    rasterizerDiscardEnable:false,
    polygonMode: VK_POLYGON_MODE_FILL,
    cullMode: VK_CULL_MODE_BACK_BIT,
    frontFace: VK_FRONT_FACE_CLOCKWISE,
    lineWidth: 1,
  });

  let multisampleCreateInfo = new VkPipelineMultisampleStateCreateInfo({
    rasterizationSamples: VK_SAMPLE_COUNT_1_BIT,
    sampleShadingEnable: false,
    minSampleShading: 1,
    pSampleMask: null,
    alphaToCoverageEnable: false,
    alphaToOneEnable: false,
  });

  let colorBlendAttachmentState = new VkPipelineColorBlendAttachmentState({
    blendEnable: true,
    srcColorBlendFactor: VK_BLEND_FACTOR_SRC_ALPHA,
    dstColorBlendFactor: VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA,
    colorBlendOp: VK_BLEND_OP_ADD,
    srcAlphaBlendFactor: VK_BLEND_FACTOR_ONE,
    dstAlphaBlendFactor: VK_BLEND_FACTOR_ZERO,
    alphaBlendOp: VK_BLEND_OP_ADD,
    colorWriteMask: VK_COLOR_COMPONENT_R_BIT | VK_COLOR_COMPONENT_G_BIT | VK_COLOR_COMPONENT_B_BIT | VK_COLOR_COMPONENT_A_BIT,
  });

  let colorBlendStateCreateInfo = new VkPipelineColorBlendStateCreateInfo({
    logicOpEnable: false,
    logicOp: VK_LOGIC_OP_NO_OP,
    attachmentCount: 1,
    pAttachments: [colorBlendAttachmentState],
  });

  let layoutCreateInfo = new VkPipelineLayoutCreateInfo({
    setLayoutCount: 0,
    pSetLayout: null,
    pushConstantRangeCount: 0,
    pPushConstantRanges: null,
  });

  this.pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, layoutCreateInfo, null, this.pipelineLayout);
  assertVulkan(result);

  //VK_FORMAT_B8G8R8A8_UNORM
  let attachmentDescription = new VkAttachmentDescription({
    flags: 0,
    format: VK_FORMAT_B8G8R8A8_UNORM,
    samples: VK_SAMPLE_COUNT_1_BIT,
    loadOp: VK_ATTACHMENT_LOAD_OP_CLEAR,
    storeOp: VK_ATTACHMENT_STORE_OP_STORE,
    stencilLoadOp: VK_ATTACHMENT_LOAD_OP_DONT_CARE,
    stencilStoreOp: VK_ATTACHMENT_STORE_OP_DONT_CARE,
    initialLayout: VK_IMAGE_LAYOUT_UNDEFINED,
    finalLayout: VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
  });

  let attachmentReference = new VkAttachmentReference({
    attachment: 0,
    layout: VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
  })
}

Engine.prototype.createShaderModule = function(code){
  let uIntCode = new Uint8Array(code);
  let shaderModuleCreateInfo = new VkShaderModuleCreateInfo({
    codeSize: uIntCode.length,
    pCode: uIntCode,
  });

  let shaderModule = new VkShaderModule();
  let result = vkCreateShaderModule(this.device, shaderModuleCreateInfo, null, shaderModule)
  if (result !== VK_SUCCESS)
    console.error("vkCreateShaderModule Error");
  this.shaderModules[this.shaderModules.length] = shaderModule;
  return shaderModule;
}

Engine.prototype.shutdownVulkan = function () {
  vkDeviceWaitIdle(this.device);

  for (let i = 0; i < this.imageViews.length; i++) {
    vkDestroyImageView(this.device, this.imageViews[i], null);
  }
  vkDestroyPipelineLayout(this.device, this.pipelineLayout, null);
  for (let i = 0; i < this.shaderModules.length; i++) {
    vkDestroyShaderModule(this.device, this.shaderModules[i], null);
  }
  vkDestroySwapchainKHR(this.device, this.swapchain, null);
  vkDestroyDevice(this.device, null);
  vkDestroySurfaceKHR(this.instance, this.surface, null);
  vkDestroyInstance(this.instance, null);
}