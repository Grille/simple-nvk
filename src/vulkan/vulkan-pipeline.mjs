import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let pipelineHandles = [];

export function createPipeline(createInfo) {
  let result;
  let { shaders, buffers, viewport, usage } = createInfo;
  let shaderInputInfo = this.createShaderInput(shaders);
  let bufferInputInfo = this.createBufferInput(buffers);

  let pipelineLayout = new VkPipelineLayout();
  {
    let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
    pipelineLayoutInfo.setLayoutCount = 0;
    pipelineLayoutInfo.pushConstantRangeCount = 0;

    result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
    this.assertVulkan(result);
  }

  let renderPass = new VkRenderPass();
  {
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
    attachmentReference.attachment = 0;
    attachmentReference.layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;

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

    let subpassDependency = new VkSubpassDependency();
    subpassDependency.srcSubpass = VK_SUBPASS_EXTERNAL;
    subpassDependency.dstSubpass = 0;
    subpassDependency.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
    subpassDependency.dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
    subpassDependency.srcAccessMask = 0;
    subpassDependency.dstAccessMask = VK_ACCESS_COLOR_ATTACHMENT_READ_BIT | VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
    subpassDependency.dependencyFlags = 0;

    let renderPassCreateInfo = new VkRenderPassCreateInfo();
    renderPassCreateInfo.attachmentCount = 1;
    renderPassCreateInfo.pAttachments = [attachmentDescription];
    renderPassCreateInfo.subpassCount = 1;
    renderPassCreateInfo.pSubpasses = [subpassDescription];
    renderPassCreateInfo.dependencyCount = 1;
    renderPassCreateInfo.pDependencies = [subpassDependency];

    result = vkCreateRenderPass(this.device, renderPassCreateInfo, null, renderPass);
    this.assertVulkan(result);
  }

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
  //colorBlendStateCreateInfo.blendConstants = [0.0, 0.0, 0.0, 0.0];

  //VK_FORMAT_B8G8R8A8_UNORM

  let dynamicStates = new Int32Array([
    VK_DYNAMIC_STATE_VIEWPORT, VK_DYNAMIC_STATE_SCISSOR
  ]);

  let dynamicStateCreateInfo = new VkPipelineDynamicStateCreateInfo();
  dynamicStateCreateInfo.dynamicStateCount = dynamicStates.length;
  dynamicStateCreateInfo.pDynamicStates = dynamicStates;

  let graphicsPipelineCreateInfo = new VkGraphicsPipelineCreateInfo();
  graphicsPipelineCreateInfo.stageCount = shaderInputInfo.length;
  graphicsPipelineCreateInfo.pStages = shaderInputInfo;
  graphicsPipelineCreateInfo.pVertexInputState = bufferInputInfo.vertex;
  graphicsPipelineCreateInfo.pInputAssemblyState = bufferInputInfo.assembly;
  graphicsPipelineCreateInfo.pTessellationState = null;
  graphicsPipelineCreateInfo.pViewportState = viewport;
  graphicsPipelineCreateInfo.pRasterizationState = rasterizationCreateInfo;
  graphicsPipelineCreateInfo.pMultisampleState = multisampleCreateInfo;
  graphicsPipelineCreateInfo.pDepthStencilState = null;
  graphicsPipelineCreateInfo.pColorBlendState = colorBlendStateCreateInfo;
  graphicsPipelineCreateInfo.pDynamicState = dynamicStateCreateInfo;
  graphicsPipelineCreateInfo.layout = pipelineLayout;
  graphicsPipelineCreateInfo.renderPass = renderPass;
  graphicsPipelineCreateInfo.subpass = 0;
  graphicsPipelineCreateInfo.basePipelineHandle = null;
  graphicsPipelineCreateInfo.basePipelineIndex = -1;

  let pipeline = new VkPipeline();
  result = vkCreateGraphicsPipelines(this.device, null, 1, [graphicsPipelineCreateInfo], null, [pipeline]);
  this.assertVulkan(result);

  let handle = {
    layout: pipelineLayout,
    renderPass: renderPass,
    pipeline: pipeline,
  }
  pushHandle(this.pipelineHandles, handle);
  return handle;
}

export function destroyPipeline(handle) {
  if (handle.id === -1) return;
  vkDestroyPipeline(this.device, handle.pipeline, null);
  vkDestroyRenderPass(this.device, handle.renderPass, null);
  vkDestroyPipelineLayout(this.device, handle.layout, null);
  deleteHandle(this.pipelineHandles, handle);
}

//export function pipelineSetViewport(pipeline,viewport);


export function createViewport() {
  let viewport = new VkViewport();
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = this.window.width;
  viewport.height = this.window.height;
  viewport.minDepth = 0;
  viewport.maxDepth = 1;

  let scissor = new VkRect2D();
  scissor.offset.x = 0;
  scissor.offset.y = 0;
  scissor.extent.width = this.window.width;
  scissor.extent.height = this.window.height;

  let viewportCreateInfo = new VkPipelineViewportStateCreateInfo();
  viewportCreateInfo.viewportCount = 1;
  viewportCreateInfo.pViewports = [viewport];
  viewportCreateInfo.scissorCount = 1;
  viewportCreateInfo.pScissors = [scissor];

  return viewportCreateInfo;
}

export function createShaderInput(handles) {
  let shaderStages = [];
  let id = 0;
  
  for (let i = 0; i < handles.length; i++) {
    let handle = handles[i];
    if (handle !== null && handle.id !== -1 && handle.stage !== -1) {
      let vkStage = 0;
      switch (handle.stage) {
        case this.SHADER_STAGE_VERTEX: vkStage = VK_SHADER_STAGE_VERTEX_BIT; break;
        case this.SHADER_STAGE_FRAGMENT: vkStage = VK_SHADER_STAGE_FRAGMENT_BIT; break;
      }

      let shaderStage = new VkPipelineShaderStageCreateInfo();
      shaderStage.stage = vkStage;
      shaderStage.module = handle.shader;
      shaderStage.pName = "main";
      shaderStage.pSpecializationInfo = null;

      shaderStages[id] = shaderStage;
      id += 1;
    }
  }
  return shaderStages;
}
export function createBufferInput(handles) {
  let vertexBindings = [], vertexAttributes = [];
  let id = 0;
  
  for (let i = 0; i < handles.length; i++) {
    let handle = handles[i];
    if (handle !== null && handle.id !== -1 && handle.location !== -1) {

      let binding = new VkVertexInputBindingDescription();
      binding.binding = handle.location;
      binding.stride = handle.stride;
      binding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX; 
    
      let attribute = new VkVertexInputAttributeDescription();
      attribute.location = handle.location;
      attribute.binding = handle.location;
      attribute.format = handle.format;
      attribute.offset = 0;

      vertexBindings[id] = binding;
      vertexAttributes[id] = attribute;
      id += 1;
    }
  }

  let vertex = new VkPipelineVertexInputStateCreateInfo({});
  if (vertexBindings.length > 0) {
    vertex.vertexBindingDescriptionCount = vertexBindings.length;
    vertex.pVertexBindingDescriptions = vertexBindings;
  }
  if (vertexAttributes.length > 0) {
    vertex.vertexAttributeDescriptionCount = vertexAttributes.length;
    vertex.pVertexAttributeDescriptions = vertexAttributes;
  }

  let assembly = new VkPipelineInputAssemblyStateCreateInfo();
  assembly.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
  assembly.primitiveRestartEnabled = false;

  return { vertex, assembly }
}
