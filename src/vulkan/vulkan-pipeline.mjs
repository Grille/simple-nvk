export function getVkDescriptorSets(handles) {
  
  let storageLayoutBindings = [];
  for (let i = 0; i < handles.length; i++) {
    let { binding } = handles[i];

    let storageLayoutBinding = new VkDescriptorSetLayoutBinding();
    storageLayoutBinding.binding = binding;
    storageLayoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
    storageLayoutBinding.descriptorCount = 1;
    storageLayoutBinding.stageFlags = VK_SHADER_STAGE_COMPUTE_BIT;
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
  descriptorPoolSize.type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
  descriptorPoolSize.descriptorCount = handles.length;

  let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
  descriptorPoolInfo.maxSets = handles.length;
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

  let descriptorSets = []
  for (let i = 0; i < handles.length; i++) {
    let { binding, buffer } = handles[i];

    let descriptorSet = new VkDescriptorSet();
    result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, [descriptorSet]);
    this.assertVulkan(result);

    let bufferInfo = new VkDescriptorBufferInfo();
    bufferInfo.buffer = buffer.local.buffer;
    bufferInfo.offset = 0n;
    bufferInfo.range = buffer.length * buffer.stride;

    let writeDescriptorSet = new VkWriteDescriptorSet();
    writeDescriptorSet.dstSet = descriptorSet;
    writeDescriptorSet.dstBinding = binding;
    writeDescriptorSet.descriptorCount = 1;
    writeDescriptorSet.descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
    writeDescriptorSet.pBufferInfo = [bufferInfo];

    vkUpdateDescriptorSets(this.device, 1, [writeDescriptorSet], 0, null);

    descriptorSets[i] = descriptorSet;
  }

  return {
    descriptorPool,
    descriptorSetLayout,
    storageLayoutBindings,
    descriptorSets,
  }
}