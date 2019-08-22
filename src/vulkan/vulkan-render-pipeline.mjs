import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let renderPipelineHandles = [];
export let renderPassHandles = [];

export function createRenderPass(createInfo) {
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
  this.assertVulkan(result);

  let handle = {
    id: -1,
    vkRenderPass: renderPass,
  }

  pushHandle(this.renderPassHandles,handle);

  return handle;
}
export function destroyRenderPass(handle){
  if (handle.id===-1)return;
  vkDestroyRenderPass(this.device, handle.vkRenderPass, null);
  deleteHandle(this.renderPassHandles, handle);
}
export function createRenderPipeline(createInfo) {
  let result;
  let { renderPass, shaders, bindings, attributes, viewport = null } = createInfo;

  let vertexBindings = [];
  for (let i = 0; i < bindings.length; i++) {
    let binding = bindings[i];
    if (binding.buffer.usage === this.BUFFER_USAGE_VERTEX) {
      vertexBindings[vertexBindings.length] = binding;
    }
  }

  let shaderInputInfo = this.createShaderInput(shaders);
  let bufferInputInfo = this.createBufferInput(vertexBindings,attributes);

  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  pipelineLayoutInfo.setLayoutCount = 0;
  pipelineLayoutInfo.pushConstantRangeCount = 0;

  let pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
  this.assertVulkan(result);

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
  graphicsPipelineCreateInfo.renderPass = renderPass.vkRenderPass;
  graphicsPipelineCreateInfo.subpass = 0;
  graphicsPipelineCreateInfo.basePipelineHandle = null;
  graphicsPipelineCreateInfo.basePipelineIndex = -1;

  let pipeline = new VkPipeline();
  result = vkCreateGraphicsPipelines(this.device, null, 1, [graphicsPipelineCreateInfo], null, [pipeline]);
  this.assertVulkan(result);

  let handle = {
    vkLayout: pipelineLayout,
    vkRenderPass: renderPass.vkRenderPass,
    vkPipeline: pipeline,
    vertexBindings:vertexBindings,
  }
  pushHandle(this.renderPipelineHandles, handle);
  return handle;
}

export function destroyRenderPipeline(handle) {
  if (handle.id === -1) return;
  vkDestroyPipeline(this.device, handle.vkPipeline, null);
  vkDestroyPipelineLayout(this.device, handle.vkLayout, null);
  deleteHandle(this.renderPipelineHandles, handle);
}

export function drawIndexed(pipeline, frambuffer, indexBuffer) {

  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = 1;

  this.commandBuffers = [new VkCommandBuffer()];
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, this.commandBuffers);
  this.assertVulkan(result);

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  let cmdBuffer = this.commandBuffers[0];
  result = vkBeginCommandBuffer(cmdBuffer, commandBufferBeginInfo);
  this.assertVulkan(result);

  let renderPassBeginInfo = new VkRenderPassBeginInfo();
  renderPassBeginInfo.renderPass = pipeline.vkRenderPass;
  renderPassBeginInfo.framebuffer = frambuffer.vkFramebuffer;
  renderPassBeginInfo.renderArea.offset.x = 0;
  renderPassBeginInfo.renderArea.offset.y = 0;
  renderPassBeginInfo.renderArea.extent.width = frambuffer.width;
  renderPassBeginInfo.renderArea.extent.height = frambuffer.height;
  renderPassBeginInfo.clearValueCount = 1;
  renderPassBeginInfo.pClearValues = [new VkClearValue({
    color: new VkClearColorValue({
      float32: [0, 0, 0.5, 1],
    }),
    depthStencil: null,
  })];


  vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

  vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline.vkPipeline);


  let viewport = new VkViewport();
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = frambuffer.width;
  viewport.height = frambuffer.height;
  viewport.minDepth = 0;
  viewport.maxDepth = 1;

  let scissor = new VkRect2D();
  scissor.offset.x = 0;
  scissor.offset.y = 0;
  scissor.extent.width = frambuffer.width;
  scissor.extent.height = frambuffer.height;

  vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);

  vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);


  let offsets = new BigUint64Array([0n, 0n]);
  let bindings = pipeline.vertexBindings;
  let vertexBuffers = [];
  let id = 0;
  let length = 0;

  for (let i = 0; i < bindings.length; i++) {
    let handle = bindings[i].buffer;
    if (handle !== null && handle.id !== -1 && handle.location !== -1) {
      vertexBuffers[id] = handle.vksLocal.vkBuffer;
      length = handle.length;
      id += 1;
    }
  }

  vkCmdBindVertexBuffers(cmdBuffer, 0, vertexBuffers.length, vertexBuffers, offsets);
  vkCmdBindIndexBuffer(cmdBuffer, indexBuffer.vksLocal.vkBuffer, 0, VK_INDEX_TYPE_UINT32);

  vkCmdDrawIndexed(cmdBuffer, 6, 1, 0, 0, 0);
  //vkCmdDraw(cmdBuffer, length, 1, 0, 0);

  vkCmdEndRenderPass(cmdBuffer);

  result = vkEndCommandBuffer(cmdBuffer);
  this.assertVulkan(result);

  let submitInfo = new VkSubmitInfo();
  submitInfo.waitSemaphoreCount = 1;
  submitInfo.pWaitSemaphores = [this.semaphores.imageAviable];
  submitInfo.pWaitDstStageMask = new Int32Array([VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT]);
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [cmdBuffer];
  submitInfo.signalSemaphoreCount = 1;
  submitInfo.pSignalSemaphores = [this.semaphores.renderingDone];

  vkQueueSubmit(this.queue, 1, [submitInfo], null);

}
//export function pipelineSetViewport(pipeline,viewport);
