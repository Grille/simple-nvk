import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];

export function createBuffer(location = 0, type = 1, vec = 1, size = 1) {
  this.bufferChanged = true;

  let result = 0;

  let bindingID = location;
  let binding = new VkVertexInputBindingDescription();
  binding.binding = bindingID;
  binding.stride = type * vec;
  binding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX; 

  let attribute = new VkVertexInputAttributeDescription();
  attribute.location = location;
  attribute.binding = bindingID;
  attribute.format = VK_FORMAT_R32G32_SFLOAT;
  attribute.offset = 0;

  let bufferSize = size * vec * type;

  let bufferInfo = new VkBufferCreateInfo();
  bufferInfo.size = bufferSize;
  bufferInfo.usage = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
  bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
  bufferInfo.queueFamilyIndexCount = 0;
  bufferInfo.pQueueFamilyIndices = null;

  let buffer = new VkBuffer();
  result = vkCreateBuffer(this.device, bufferInfo, null, buffer);
  this.assertVulkan(result);
  
  let memoryRequirements = new VkMemoryRequirements()
  vkGetBufferMemoryRequirements(this.device, buffer, memoryRequirements);
  
  let memoryAllocateInfo = new VkMemoryAllocateInfo();
  memoryAllocateInfo.allocationSize = memoryRequirements.size;
  memoryAllocateInfo.memoryTypeIndex = this.findMemoryTypeIndex(
    memoryRequirements.memoryTypeBits,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );

  let deviceMemory = new VkDeviceMemory();
  result = vkAllocateMemory(this.device, memoryAllocateInfo, null, deviceMemory);
  this.assertVulkan(result);

  vkBindBufferMemory(this.device, buffer, deviceMemory, 0n);

  let bufferHandle = {
    bindingInfo: binding,
    attributeInfo: attribute,
    memory: deviceMemory,
    data: null,
    buffer: buffer,
    id: -1,
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}
export function updateBuffer(handle, data, offset, length) {
  let dataPtr = { $: 0n };
  
  let result = vkMapMemory(this.device, handle.memory, offset, length, 0, dataPtr);
  this.assertVulkan(result);

  
  let verticesBuffer = ArrayBuffer.fromAddress(dataPtr.$, length*4*2);
  let srcView = new Float32Array(data);
  let dstView = new Float32Array(verticesBuffer);
  for (let ii = 0; ii < srcView.length; ++ii) {
    dstView[ii] = srcView[ii];
  };
  
  /*
  let mappedBuffer = ArrayBuffer.fromAddress(dataPtr.$, length);
  let srcView = new Uint8Array(data);
  let dstView = new Uint8Array(mappedBuffer);
  dstView.set(srcView, 0x0);
  */
  
  vkUnmapMemory(this.device, handle.memory);
}
export function destroyBuffer(handle) {
  if (handle.id === -1) return;
  this.bufferChanged = true;
  vkFreeMemory(this.device, handle.memory);
  vkDestroyBuffer(this.device, handle.buffer, null);
  deleteHandle(bufferHandles, handle);
}
export function findMemoryTypeIndex(typeFilter, properties) {
  let memoryProperties = new VkPhysicalDeviceMemoryProperties();
  vkGetPhysicalDeviceMemoryProperties(this.physicalDevice, memoryProperties);
  for (let i = 0; i < memoryProperties.memoryTypeCount; i++) {
    if (typeFilter & (1 << i) && ((memoryProperties.memoryTypes[i].propertyFlags & properties))) {
      return i;
    }
  }
}