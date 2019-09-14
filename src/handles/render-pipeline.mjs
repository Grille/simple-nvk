import nvk from "nvk"
import { pushHandle, deleteHandle, assertVulkan } from "../utils.mjs"
import { createShaderInput, createBufferInput, createPipelineLayout, destroyPipelineLayout } from "../vulkan-pipeline.mjs"
import Handle from "./handle.mjs";
//export let pipelineHandle = null;

export let renderPassHandles = [];

export function createRenderPass(createInfo) {
  let handle = new RenderPassHandle(this, createInfo);
  pushHandle(this.renderPassHandles, handle);
  return handle;
}

export function destroyRenderPass(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.renderPassHandles, handle);
}

class RenderPassHandle extends Handle {
  constructor(snvk, { backgroundColor = [0, 0, 0, 1] }) {
    super(snvk);
    let renderPass = new VkRenderPass();

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
  
    let result = vkCreateRenderPass(this.device, renderPassCreateInfo, null, renderPass);
    assertVulkan(result);

    this.vkRenderPass = renderPass;
    this.backgroundColor = backgroundColor;
  }
  destroy(){
    vkDestroyRenderPass(this.device, this.vkRenderPass, null);
  }
}

export let renderPipelineHandles = [];

export function createRenderPipeline(createInfo) {
  let handle = new RenderPipelineHandle(this, createInfo);
  pushHandle(this.renderPipelineHandles, handle);
  return handle;
}

export function destroyRenderPipeline(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.renderPipelineHandles, handle);
}

class RenderPipelineHandle extends Handle {
  constructor(snvk,
    {
      renderPass, shaders = [], descriptors = [], attributes = [],
      backgroundColor = [0, 0, 0, 1],
      rasterizationInfo = {}, blendingInfo = {}, assemblyInfo = {},
      viewport = null, basePipeline = null
    }) {
    super(snvk);

    let {
      polygonMode = VK_POLYGON_MODE_FILL, cullMode = VK_CULL_MODE_BACK_BIT, frontFace = VK_FRONT_FACE_CLOCKWISE, lineWidth = 1
    } = rasterizationInfo;
    let {
      srcColorBlendFactor = VK_BLEND_FACTOR_SRC_ALPHA, dstColorBlendFactor = VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA, colorBlendOp = VK_BLEND_OP_ADD,
      srcAlphaBlendFactor = VK_BLEND_FACTOR_ONE, dstAlphaBlendFactor = VK_BLEND_FACTOR_ZERO, alphaBlendOp = VK_BLEND_OP_ADD, enabled = true,
    } = blendingInfo;
    let {
      primitiveRestartEnabled = false, topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
    } = assemblyInfo;

    let result;
    let bindings = [];
    for (let i = 0; i < attributes.length; i++) {
      let binding = attributes[i].binding;
      if (!bindings.includes(binding)) {
        bindings.push(binding);
      }
    }

    let shaderInputInfo = createShaderInput(snvk, shaders);
    let bufferInputInfo = createBufferInput(snvk, bindings, attributes);
    let pipelineLayout = createPipelineLayout(snvk, descriptors, VK_SHADER_STAGE_VERTEX_BIT | VK_SHADER_STAGE_FRAGMENT_BIT);

    let assemblyCreateInfo = new VkPipelineInputAssemblyStateCreateInfo();
    assemblyCreateInfo.topology = topology;
    assemblyCreateInfo.primitiveRestartEnabled = primitiveRestartEnabled;

    let rasterizationCreateInfo = new VkPipelineRasterizationStateCreateInfo();
    rasterizationCreateInfo.depthClampEnable = false;
    rasterizationCreateInfo.rasterizerDiscardEnable = false;
    rasterizationCreateInfo.polygonMode = polygonMode;
    rasterizationCreateInfo.cullMode = cullMode;
    rasterizationCreateInfo.frontFace = frontFace;
    rasterizationCreateInfo.lineWidth = lineWidth;

    let multisampleCreateInfo = new VkPipelineMultisampleStateCreateInfo();
    multisampleCreateInfo.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;
    multisampleCreateInfo.sampleShadingEnable = false;
    multisampleCreateInfo.minSampleShading = 1;
    multisampleCreateInfo.pSampleMask = null;
    multisampleCreateInfo.alphaToCoverageEnable = false;
    multisampleCreateInfo.alphaToOneEnable = false;

    let colorBlendAttachmentState = new VkPipelineColorBlendAttachmentState();
    colorBlendAttachmentState.blendEnable = enabled;
    colorBlendAttachmentState.srcColorBlendFactor = srcColorBlendFactor;
    colorBlendAttachmentState.dstColorBlendFactor = dstColorBlendFactor;
    colorBlendAttachmentState.colorBlendOp = colorBlendOp;
    colorBlendAttachmentState.srcAlphaBlendFactor = srcAlphaBlendFactor;
    colorBlendAttachmentState.dstAlphaBlendFactor = dstAlphaBlendFactor;
    colorBlendAttachmentState.alphaBlendOp = alphaBlendOp;
    colorBlendAttachmentState.colorWriteMask = VK_COLOR_COMPONENT_R_BIT | VK_COLOR_COMPONENT_G_BIT | VK_COLOR_COMPONENT_B_BIT | VK_COLOR_COMPONENT_A_BIT;

    let colorBlendStateCreateInfo = new VkPipelineColorBlendStateCreateInfo();
    colorBlendStateCreateInfo.logicOpEnable = false;
    colorBlendStateCreateInfo.logicOp = VK_LOGIC_OP_NO_OP;
    colorBlendStateCreateInfo.attachmentCount = 1;
    colorBlendStateCreateInfo.pAttachments = [colorBlendAttachmentState];

    let dynamicStates = new Int32Array([
      //VK_DYNAMIC_STATE_VIEWPORT, VK_DYNAMIC_STATE_SCISSOR
    ]);

    let dynamicStateCreateInfo = new VkPipelineDynamicStateCreateInfo();
    dynamicStateCreateInfo.dynamicStateCount = dynamicStates.length;
    dynamicStateCreateInfo.pDynamicStates = dynamicStates;

    let graphicsPipelineCreateInfo = new VkGraphicsPipelineCreateInfo();
    graphicsPipelineCreateInfo.stageCount = shaderInputInfo.length;
    graphicsPipelineCreateInfo.pStages = shaderInputInfo;
    graphicsPipelineCreateInfo.pVertexInputState = bufferInputInfo;
    graphicsPipelineCreateInfo.pInputAssemblyState = assemblyCreateInfo;
    graphicsPipelineCreateInfo.pTessellationState = null;
    graphicsPipelineCreateInfo.pViewportState = viewport;
    graphicsPipelineCreateInfo.pRasterizationState = rasterizationCreateInfo;
    graphicsPipelineCreateInfo.pMultisampleState = multisampleCreateInfo;
    graphicsPipelineCreateInfo.pDepthStencilState = null;
    graphicsPipelineCreateInfo.pColorBlendState = colorBlendStateCreateInfo;
    graphicsPipelineCreateInfo.pDynamicState = dynamicStateCreateInfo;
    graphicsPipelineCreateInfo.layout = pipelineLayout.vkPipelineLayout;
    graphicsPipelineCreateInfo.renderPass = renderPass.vkRenderPass;
    graphicsPipelineCreateInfo.subpass = 0;
    graphicsPipelineCreateInfo.basePipelineHandle = basePipeline;
    graphicsPipelineCreateInfo.basePipelineIndex = -1;

    let pipeline = new VkPipeline();
    result = vkCreateGraphicsPipelines(this.device, null, 1, [graphicsPipelineCreateInfo], null, [pipeline]);
    assertVulkan(result);

    this.layout = pipelineLayout;
    this.vkRenderPass = renderPass.vkRenderPass;
    this.vkPipeline = pipeline;
    this.vertexBindings = bindings;
    this.backgroundColor = backgroundColor;
  }
  destroy(){
    destroyPipelineLayout(this.snvk, this.layout);
    vkDestroyPipeline(this.device, this.vkPipeline, null);
  }
}
