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
    this.swapImageViews = [];
    this.shaderModules = [];
    this.pipelineLayout = null;
    this.renderPass = null;
    this.pipeline = null;
    this.framebuffers = [];
    this.commandPool = null;
    this.commandBuffers = [];
    this.semaphores = {
      imageAviable: null,
      renderingDone: null,
    }
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

  let validationLayers = ["VK_LAYER_LUNARG_standard_validation","VK_LAYER_LUNARG_parameter_validation"];
  let extensions = [...this.window.getRequiredInstanceExtensions()];
  let result = 0;
  /*
  for (let key in this.window) {
      console.log(key);
  };*/

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

  let swapchainCreateInfo = new VkSwapchainCreateInfoKHR();
  swapchainCreateInfo.surface = this.surface;
  swapchainCreateInfo.minImageCount = 2;
  swapchainCreateInfo.imageFormat = VK_FORMAT_B8G8R8A8_UNORM;
  swapchainCreateInfo.imageColorSpace = VK_COLOR_SPACE_SRGB_NONLINEAR_KHR;
  swapchainCreateInfo.imageExtent = new VkExtent2D({ width: 480, height: 320 });
  swapchainCreateInfo.imageArrayLayers = 1;
  swapchainCreateInfo.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
  swapchainCreateInfo.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
  swapchainCreateInfo.queueFamilyIndexCount = 0;
  swapchainCreateInfo.pQueueFamilyIndices = null;
  swapchainCreateInfo.preTransform = VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR;
  swapchainCreateInfo.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
  swapchainCreateInfo.presentMode = VK_PRESENT_MODE_FIFO_KHR;
  swapchainCreateInfo.clipped = true;
  swapchainCreateInfo.oldSwapchain = this.swapchain;

  this.swapchain = new VkSwapchainKHR();
  vkCreateSwapchainKHR(this.device, swapchainCreateInfo, null, this.swapchain);

  let swapchainImageCount = { $: 0 };
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, null);
  let swapchainImages = new InitializedArray(VkImage, swapchainImageCount.$);
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, swapchainImages)

  this.swapImageViews = new InitializedArray(VkImageView, swapchainImageCount.$);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    let imageViewCreateInfo = new VkImageViewCreateInfo();
    imageViewCreateInfo.image = swapchainImages[i];
    imageViewCreateInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
    imageViewCreateInfo.format = VK_FORMAT_B8G8R8A8_UNORM;
    imageViewCreateInfo.components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
    imageViewCreateInfo.components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
    imageViewCreateInfo.components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
    imageViewCreateInfo.components.a = VK_COMPONENT_SWIZZLE_IDENTITY;
    imageViewCreateInfo.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
    imageViewCreateInfo.subresourceRange.baseMipLevel = 0;
    imageViewCreateInfo.subresourceRange.levelCount = 1;
    imageViewCreateInfo.subresourceRange.baseArrayLayer = 0;
    imageViewCreateInfo.subresourceRange.layerCount = 1;

    vkCreateImageView(this.device, imageViewCreateInfo, null, this.swapImageViews[i]);
  }

  let shaderVert = fs.readFileSync("./src/vert.spv");
  let shaderFrag = fs.readFileSync("./src/frag.spv");

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

  let vertexInputCreateInfo = new VkPipelineVertexInputStateCreateInfo({});

  let inputAssemblyCreateInfo = new VkPipelineInputAssemblyStateCreateInfo();
  inputAssemblyCreateInfo.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
  inputAssemblyCreateInfo.primitiveRestartEnabled = false;

  let viewport = new VkViewport();
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = 480;
  viewport.height = 320;
  viewport.minDepth = 0;
  viewport.maxDepth = 1
  
  let scissor = new VkRect2D();
  scissor.offset.x = 0;
  scissor.offset.y = 0;
  scissor.extent.width = 480;
  scissor.extent.height = 320;

  let viewports = new InitializedArray(VkViewport, 1);

  let viewportCreateInfo = new VkPipelineViewportStateCreateInfo();
  viewportCreateInfo.viewportCount = viewports.length;
  viewportCreateInfo.pViewport = viewports;
  viewportCreateInfo.scissorCount = 1;
  viewportCreateInfo.pScissor = [scissor];

  let rasterizationCreateInfo = new VkPipelineRasterizationStateCreateInfo();
  rasterizationCreateInfo.depthClampEnable = false;
  rasterizationCreateInfo.rasterizerDiscardEnable = false;
  rasterizationCreateInfo.polygonMode = VK_POLYGON_MODE_FILL;
  rasterizationCreateInfo.cullMode = VK_CULL_MODE_BACK_BIT;
  rasterizationCreateInfo.frontFace = VK_FRONT_FACE_CLOCKWISE;
  rasterizationCreateInfo.lineWidth = 1;

  let multisampleCreateInfo = new VkPipelineMultisampleStateCreateInfo();
  multisampleCreateInfo.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;
  multisampleCreateInfo.sampleShadingEnable = false;
  multisampleCreateInfo.minSampleShading = 1;
  multisampleCreateInfo.pSampleMask = null;
  multisampleCreateInfo.alphaToCoverageEnable = false;
  multisampleCreateInfo.alphaToOneEnable = false;

  let colorBlendAttachmentState = new VkPipelineColorBlendAttachmentState();
  colorBlendAttachmentState.blendEnable = true;
  colorBlendAttachmentState.srcColorBlendFactor = VK_BLEND_FACTOR_SRC_ALPHA;
  colorBlendAttachmentState.dstColorBlendFactor = VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA;
  colorBlendAttachmentState.colorBlendOp = VK_BLEND_OP_ADD;
  colorBlendAttachmentState.srcAlphaBlendFactor = VK_BLEND_FACTOR_ONE;
  colorBlendAttachmentState.dstAlphaBlendFactor = VK_BLEND_FACTOR_ZERO;
  colorBlendAttachmentState.alphaBlendOp = VK_BLEND_OP_ADD;
  colorBlendAttachmentState.colorWriteMask = VK_COLOR_COMPONENT_R_BIT | VK_COLOR_COMPONENT_G_BIT | VK_COLOR_COMPONENT_B_BIT | VK_COLOR_COMPONENT_A_BIT;

  let colorBlendStateCreateInfo = new VkPipelineColorBlendStateCreateInfo();
  colorBlendStateCreateInfo.logicOpEnable = false;
  colorBlendStateCreateInfo.logicOp = VK_LOGIC_OP_NO_OP;
  colorBlendStateCreateInfo.attachmentCount = 1;
  colorBlendStateCreateInfo.pAttachments = [colorBlendAttachmentState];

  let layoutCreateInfo = new VkPipelineLayoutCreateInfo();
  layoutCreateInfo.setLayoutCount = 0;
  layoutCreateInfo.pSetLayout = null;
  layoutCreateInfo.pushConstantRangeCount = 0;
  layoutCreateInfo.pPushConstantRanges = null;


  this.pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, layoutCreateInfo, null, this.pipelineLayout);
  assertVulkan(result);

  //VK_FORMAT_B8G8R8A8_UNORM
  let attachmentDescription = new VkAttachmentDescription();
  attachmentDescription.flags = 0;
  attachmentDescription.format = VK_FORMAT_B8G8R8A8_UNORM;
  attachmentDescription.samples = VK_SAMPLE_COUNT_1_BIT;
  attachmentDescription.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
  attachmentDescription.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
  attachmentDescription.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
  attachmentDescription.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
  attachmentDescription.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
  attachmentDescription.finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR;

  let attachmentReference = new VkAttachmentReference();
  attachmentReference.attachment= 0;
  attachmentReference.layout= VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;


  let subpassDescription = new VkSubpassDescription();
  subpassDescription.pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS;
  subpassDescription.inputAttachmentCount = 0;
  subpassDescription.pInputAttachments = null;
  subpassDescription.colorAttachmentCount = 1;
  subpassDescription.pColorAttachments = [attachmentReference];
  subpassDescription.pResolveAttachments = null;
  subpassDescription.pDepthStencilAttachment = null;
  subpassDescription.preserveAttachmentCount = 0;
  subpassDescription.pPreserveAttachments = null;

  let renderPassCreateInfo = new VkRenderPassCreateInfo();
  renderPassCreateInfo.attachmentCount = 1;
  renderPassCreateInfo.pAttachments = [attachmentDescription];
  renderPassCreateInfo.subpassCount = 1;
  renderPassCreateInfo.pSubpasses = [subpassDescription];
  renderPassCreateInfo.dependencyCount = 0;
  renderPassCreateInfo.pDependencies = null;

  let dynamicStateCreateInfo = new VkPipelineDynamicStateCreateInfo();
  dynamicStateCreateInfo.dynamicStateCount = 0;
  dynamicStateCreateInfo.pDynamicStates = null;//new Int32Array([VK_DYNAMIC_STATE_VIEWPORT, VK_DYNAMIC_STATE_SCISSOR]),

  this.renderPass = new VkRenderPass();
  vkCreateRenderPass(this.device, renderPassCreateInfo, null, this.renderPass);

  let graphicsPipelineCreateInfo = new VkGraphicsPipelineCreateInfo();
  graphicsPipelineCreateInfo.stageCount = 2;
  graphicsPipelineCreateInfo.pStages = shaderStageInfos;
  graphicsPipelineCreateInfo.pVertexInputState = vertexInputCreateInfo;
  graphicsPipelineCreateInfo.pInputAssemblyState = inputAssemblyCreateInfo;
  graphicsPipelineCreateInfo.pTessellationState = null;
  graphicsPipelineCreateInfo.pViewportState = viewportCreateInfo;
  graphicsPipelineCreateInfo.pRasterizationState = rasterizationCreateInfo;
  graphicsPipelineCreateInfo.pMultisampleState = multisampleCreateInfo;
  graphicsPipelineCreateInfo.pDepthStencilState = null;
  graphicsPipelineCreateInfo.pColorBlendState = colorBlendStateCreateInfo;
  graphicsPipelineCreateInfo.pDynamicState = dynamicStateCreateInfo;
  graphicsPipelineCreateInfo.layout = this.pipelineLayout;
  graphicsPipelineCreateInfo.renderPass = this.renderPass;
  graphicsPipelineCreateInfo.subpass = 0;
  graphicsPipelineCreateInfo.basePipelineHandle = null;
  graphicsPipelineCreateInfo.basePipelineIndex = -1;

  this.pipeline = new VkPipeline();
  vkCreateGraphicsPipelines(this.device, null, 1, [graphicsPipelineCreateInfo], null, [this.pipeline]);

  this.framebuffers = new InitializedArray(VkFramebuffer, this.swapImageViews.length);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    let framebufferCreateInfo = new VkFramebufferCreateInfo();
    framebufferCreateInfo.renderPass = this.renderPass;
    framebufferCreateInfo.attachmentCount = 1;
    framebufferCreateInfo.pAttachments = [this.swapImageViews[i]];
    framebufferCreateInfo.width = 480;
    framebufferCreateInfo.height = 320;
    framebufferCreateInfo.layers = 1;

    vkCreateFramebuffer(this.device, framebufferCreateInfo, null, this.framebuffers[i]);
  }

  let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
  commandPoolCreateInfo.queueFamilyIndex = queueFamily;

  this.commandPool = new VkCommandPool();
  vkCreateCommandPool(this.device, commandPoolCreateInfo, null, this.commandPool);

  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = this.swapImageViews.length;

  this.commandBuffers = new InitializedArray(VkCommandBuffer, this.swapImageViews.length);
  vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, this.commandBuffers);

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  for (let i = 0; i < this.swapImageViews.length; i++) {
    let cmdBuffer = this.commandBuffers[i];
    vkBeginCommandBuffer(cmdBuffer, commandBufferBeginInfo);

    let renderPassBeginInfo = new VkRenderPassBeginInfo();
    renderPassBeginInfo.renderPass = this.renderPass;
    renderPassBeginInfo.framebuffer = this.framebuffers[i];
    renderPassBeginInfo.renderArea.offset.x = 0;
    renderPassBeginInfo.renderArea.offset.y = 0;
    renderPassBeginInfo.renderArea.extent.width = 480;
    renderPassBeginInfo.renderArea.extent.height = 320;
    renderPassBeginInfo.clearValueCount = 1;
    renderPassBeginInfo.pClearValues = [new VkClearValue({
      color: new VkClearColorValue({
        float32: [0, 0, 0, 1],
      }),
      depthStencil: null,
    })],


    vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE)

    vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, this.pipeline);

    vkCmdDraw(cmdBuffer, 3, 1, 0, 0);

    vkCmdEndRenderPass(cmdBuffer);

    vkEndCommandBuffer(cmdBuffer);
  }

  /*
  let semaphoreCreateInfo = new VkSemaphoreCreateInfo();
  this.semaphores.imageAviable = new VkSemaphore();
  this.semaphores.renderingDone = new VkSemaphore();
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.imageAviable);
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, this.semaphores.renderingDone);
  */
}

Engine.prototype.drawFrame = function(){

}

Engine.prototype.createShaderModule = function (code) {
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

 
  vkFreeCommandBuffers(this.device, this.commandPool, this.commandBuffers.length, this.commandBuffers);
  vkDestroyCommandPool(this.device, this.commandPool, null);
  for (let i = 0; i < this.framebuffers.length; i++) {
    vkDestroyFramebuffer(this.device, this.framebuffers[i], null);
  }
  vkDestroyPipeline(this.device, this.pipeline, null);
  vkDestroyRenderPass(this.device, this.renderPass, null);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    vkDestroyImageView(this.device, this.swapImageViews[i], null);
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