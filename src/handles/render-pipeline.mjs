import { assertVulkan } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class RenderPipelineHandle extends Handle {
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
    let pipelineLayout = snvk.createPipelineLayout({ descriptors, flags: (VK_SHADER_STAGE_VERTEX_BIT | VK_SHADER_STAGE_FRAGMENT_BIT) });

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
    this.super_destroy();
    this.layout.destroy();
    vkDestroyPipeline(this.device, this.vkPipeline, null);
  }
}

function createShaderInput(snvk, shaders) {
  let shaderStages = [];
  
  for (let i = 0; i < shaders.length; i++) {
    let shader = shaders[i];
    let shaderStage = new VkPipelineShaderStageCreateInfo();
    shaderStage.stage = shader.stage;
    shaderStage.module = shader.vkShader;
    shaderStage.pName = "main";
    shaderStage.pSpecializationInfo = null;

    shaderStages[i] = shaderStage;
  }
  return shaderStages;
}

function createBufferInput(snvk, bindings,attributes) {
  let vertexBindings = [], vertexAttributes = [];
  let id = 0;
  
  for (let i = 0; i < bindings.length; i++) {
    let binding = bindings[i];

    let vertexBinding = new VkVertexInputBindingDescription();
    vertexBinding.binding = binding.binding;
    vertexBinding.stride = binding.stride;
    vertexBinding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;

    vertexBindings[i] = vertexBinding;
  }

  for (let i = 0; i < attributes.length; i++) {
    let attribute = attributes[i];

    let vertexAttribute = new VkVertexInputAttributeDescription();
    vertexAttribute.location = attribute.location;
    vertexAttribute.binding = attribute.binding.binding;
    vertexAttribute.format = attribute.format;
    vertexAttribute.offset = attribute.offset;

    vertexAttributes[i] = vertexAttribute;
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

  return vertex;
}