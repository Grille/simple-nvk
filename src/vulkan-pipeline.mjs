import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let pipelineLayoutHandles = [];

export function createPipelineLayout(descriptors, flags) {
  let result = 0;

  let descriptorSetLayout = null;
  let descriptorPool = null;
  let descriptorSet = null;

  let enabled = descriptors.length > 0;
  if (enabled) {
    let typeCounter = new Uint8Array(20);
    let descriptorPoolSizes = [];
    let layoutBindings = [];

    for (let i = 0; i < descriptors.length; i++) {
      let { binding, type } = descriptors[i];

      let layoutBinding = new VkDescriptorSetLayoutBinding();
      layoutBinding.binding = binding;
      layoutBinding.descriptorType = type;
      layoutBinding.descriptorCount = 1;
      layoutBinding.stageFlags = flags;
      layoutBinding.pImmutableSamplers = null;

      typeCounter[type] += 1;

      layoutBindings[i] = layoutBinding;
    }

    let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
    layoutInfo.bindingCount = layoutBindings.length;
    layoutInfo.pBindings = layoutBindings;

    descriptorSetLayout = new VkDescriptorSetLayout();
    result = vkCreateDescriptorSetLayout(this.device, layoutInfo, null, descriptorSetLayout);
    this.assertVulkan(result);

    for (let type = 0; type < typeCounter.length; type++) {
      let count = typeCounter[type];

      if (count > 0) {
        let descriptorPoolSize = new VkDescriptorPoolSize();
        descriptorPoolSize.type = type;
        descriptorPoolSize.descriptorCount = count;
        descriptorPoolSizes.push(descriptorPoolSize);
      }
    }

    let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
    descriptorPoolInfo.maxSets = descriptors.length;
    descriptorPoolInfo.poolSizeCount = descriptorPoolSizes.length;
    descriptorPoolInfo.pPoolSizes = descriptorPoolSizes;

    descriptorPool = new VkDescriptorPool();
    result = vkCreateDescriptorPool(this.device, descriptorPoolInfo, null, descriptorPool);
    this.assertVulkan(result);

    let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
    descriptorSetAllocInfo.descriptorPool = descriptorPool;
    descriptorSetAllocInfo.descriptorSetCount = 1;
    descriptorSetAllocInfo.pSetLayouts = [descriptorSetLayout];

    descriptorSet = new VkDescriptorSet();
    result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, [descriptorSet]);
    this.assertVulkan(result);

    let writeDescriptorSets = [];

    for (let i = 0; i < descriptors.length; i++) {
      let { buffer, binding, type } = descriptors[i];

      let bufferInfo = new VkDescriptorBufferInfo();
      bufferInfo.buffer = buffer.vksLocal.vkBuffer;
      bufferInfo.offset = 0n;
      bufferInfo.range = buffer.size;

      let writeDescriptorSet = new VkWriteDescriptorSet();
      writeDescriptorSet.dstSet = descriptorSet;
      writeDescriptorSet.dstBinding = binding;
      writeDescriptorSet.descriptorCount = 1;
      writeDescriptorSet.descriptorType = type;
      writeDescriptorSet.pBufferInfo = [bufferInfo];

      writeDescriptorSets[i] = writeDescriptorSet;
    }
    vkUpdateDescriptorSets(this.device, descriptors.length, writeDescriptorSets, 0, null);
  }

  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  if (enabled) {
    pipelineLayoutInfo.setLayoutCount = 1;
    pipelineLayoutInfo.pSetLayouts = [descriptorSetLayout];
  }

  let pipelineLayout = new VkPipelineLayout();
  result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
  this.assertVulkan(result);

  let handle = {
    vkPipelineLayout: pipelineLayout,
    vkPool: descriptorPool,
    vkSetLayout: descriptorSetLayout,
    vkSet: descriptorSet,
    enabled: enabled,
  }

  pushHandle(this.pipelineLayoutHandles, handle);

  return handle;
}

export function destroyPipelineLayout(handle) {
  if (handle.id === -1) return;
  vkDestroyDescriptorSetLayout(this.device, handle.vkSetLayout, null);
  vkDestroyDescriptorPool(this.device, handle.vkPool, null);
  vkDestroyPipelineLayout(this.device, handle.vkPipelineLayout, null);
  deleteHandle(this.pipelineLayoutHandles, handle);
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