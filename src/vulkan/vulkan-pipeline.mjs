import { InitializedArray } from "./utils.mjs"


export function createPipelineLayout(descriptors, flags) {
  let result = 0;
  let descriptorSetLayouts = [];
  let descriptorPoolSizes = [];
  let descriptorTypes = [];
  let maxSets = 0;

  let i = 0;

  for (let i = 0; i < descriptors.length; i++) {
    let { bindings, type } = descriptors[i];
    if (bindings.length === 0) continue;

    let layoutBindings = [];

    for (let i2 = 0; i2 < bindings.length; i2++) {
      let { binding } = bindings[i2];

      let storageLayoutBinding = new VkDescriptorSetLayoutBinding();
      storageLayoutBinding.binding = binding;
      storageLayoutBinding.descriptorType = type;
      storageLayoutBinding.descriptorCount = 1;
      storageLayoutBinding.stageFlags = flags;
      storageLayoutBinding.pImmutableSamplers = null;

      layoutBindings[i2] = storageLayoutBinding;
    }

    let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
    layoutInfo.bindingCount = layoutBindings.length;
    layoutInfo.pBindings = layoutBindings;

    let descriptorSetLayout = new VkDescriptorSetLayout();
    result = vkCreateDescriptorSetLayout(this.device, layoutInfo, null, descriptorSetLayout);
    this.assertVulkan(result);

    let descriptorPoolSize = new VkDescriptorPoolSize();
    descriptorPoolSize.type = type;
    descriptorPoolSize.descriptorCount = bindings.length;

    descriptorSetLayouts.push(descriptorSetLayout);
    descriptorPoolSizes.push(descriptorPoolSize);
    descriptorTypes.push(type);
    maxSets += bindings.length;
  }

  let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
  if (descriptorPoolSizes.length > 0) {
    descriptorPoolInfo.maxSets = maxSets;
    descriptorPoolInfo.poolSizeCount = descriptorPoolSizes.length;
    descriptorPoolInfo.pPoolSizes = descriptorPoolSizes;
  }

  let descriptorPool = new VkDescriptorPool();
  result = vkCreateDescriptorPool(this.device, descriptorPoolInfo, null, descriptorPool);
  this.assertVulkan(result);

  let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
  if (descriptorSetLayouts.length > 0) {
    descriptorSetAllocInfo.descriptorPool = descriptorPool;
    descriptorSetAllocInfo.descriptorSetCount = descriptorSetLayouts.length;
    descriptorSetAllocInfo.pSetLayouts = descriptorSetLayouts;
  }

  let descriptorSets = new InitializedArray(VkDescriptorSet, descriptorSetLayouts.length);
  result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, descriptorSets);
  this.assertVulkan(result);

  for (let i = 0; i < descriptors.length; i++) {
    let { bindings, type } = descriptors[i];
    let writeDescriptorSets = [];

    for (let i2 = 0; i2 < bindings.length; i2++) {
      let { binding, buffer } = bindings[i2];

      let bufferInfo = new VkDescriptorBufferInfo();
      bufferInfo.buffer = buffer.vksLocal.vkBuffer;
      bufferInfo.offset = 0n;
      bufferInfo.range = buffer.size;

      let writeDescriptorSet = new VkWriteDescriptorSet();
      writeDescriptorSet.dstSet = descriptorSets[i];
      writeDescriptorSet.dstBinding = binding;
      writeDescriptorSet.descriptorCount = 1;
      writeDescriptorSet.descriptorType = type;
      writeDescriptorSet.pBufferInfo = [bufferInfo];

      writeDescriptorSets[i2] = writeDescriptorSet;

    }

    vkUpdateDescriptorSets(this.device, bindings.length, writeDescriptorSets, 0, null);
  }

  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  if (descriptorSetLayouts.length > 0) {
    pipelineLayoutInfo.setLayoutCount = descriptorSetLayouts.length;
    pipelineLayoutInfo.pSetLayouts = descriptorSetLayouts;
  }

  let pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
  this.assertVulkan(result);

  return {
    vkPipelineLayout: pipelineLayout,
    vkPool: descriptorPool,
    vkaSetLayouts: descriptorSetLayouts,
    vkaSets: descriptorSets,
  }
}

export function destroyPipelineLayout(object) {
  for (let i = 0; i < object.vkaSetLayouts.length; i++) {
    vkDestroyDescriptorSetLayout(this.device, object.vkaSetLayouts[i], null);
  }
  vkDestroyDescriptorPool(this.device, object.vkPool, null);
  vkDestroyPipelineLayout(this.device, object.vkPipelineLayout, null);
}

export function createShaderInput(shaders) {
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
export function createBufferInput(bindings,attributes) {
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