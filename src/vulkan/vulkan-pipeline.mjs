import { InitializedArray } from "./utils.mjs"

export function getVkBindingDescriptors(handles, type, flags) {

  let storageLayoutBindings = [];
  for (let i = 0; i < handles.length; i++) {
    let { binding } = handles[i];

    let storageLayoutBinding = new VkDescriptorSetLayoutBinding();
    storageLayoutBinding.binding = binding;
    storageLayoutBinding.descriptorType = type;
    storageLayoutBinding.descriptorCount = 1;
    storageLayoutBinding.stageFlags = flags;
    storageLayoutBinding.pImmutableSamplers = null;

    storageLayoutBindings[i] = storageLayoutBinding;
  }

  let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
  layoutInfo.bindingCount = handles.length;
  layoutInfo.pBindings = storageLayoutBindings;

  let descriptorSetLayout = new VkDescriptorSetLayout();
  let result = vkCreateDescriptorSetLayout(this.device, layoutInfo, null, descriptorSetLayout);
  this.assertVulkan(result);

  let descriptorPoolSize = new VkDescriptorPoolSize();
  descriptorPoolSize.type = type;
  descriptorPoolSize.descriptorCount = handles.length;

  let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
  descriptorPoolInfo.maxSets = 1;
  descriptorPoolInfo.poolSizeCount = 1;
  descriptorPoolInfo.pPoolSizes = [descriptorPoolSize];

  let descriptorPool = new VkDescriptorPool();
  result = vkCreateDescriptorPool(this.device, descriptorPoolInfo, null, descriptorPool);
  this.assertVulkan(result);

  // descriptorsets
  let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
  descriptorSetAllocInfo.descriptorPool = descriptorPool;
  descriptorSetAllocInfo.descriptorSetCount = 1;
  descriptorSetAllocInfo.pSetLayouts = [descriptorSetLayout];

  let descriptorSet = new VkDescriptorSet();
  result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, [descriptorSet]);
  this.assertVulkan(result);

  let writeDescriptorSets = [];
  for (let i = 0; i < handles.length; i++) {
    let { binding, buffer } = handles[i];

    let bufferInfo = new VkDescriptorBufferInfo();
    bufferInfo.buffer = buffer.local.buffer;
    bufferInfo.offset = 0n;
    bufferInfo.range = buffer.length * buffer.stride;

    let writeDescriptorSet = new VkWriteDescriptorSet();
    writeDescriptorSet.dstSet = descriptorSet;
    writeDescriptorSet.dstBinding = binding;
    writeDescriptorSet.descriptorCount = 1;
    writeDescriptorSet.descriptorType = type;
    writeDescriptorSet.pBufferInfo = [bufferInfo];

    writeDescriptorSets[i] = writeDescriptorSet;
  }

  vkUpdateDescriptorSets(this.device, handles.length, writeDescriptorSets, 0, null);


  return {
    pool: descriptorPool,
    layout: descriptorSetLayout,
    set: descriptorSet,
  }
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
        default: continue;
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