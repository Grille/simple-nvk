import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];

export function createBuffer(location = 0, type = 1, vec = 1, size = 1) {
  this.bufferChanged = true;

  let bindingID = 0;
  let binding = new VkVertexInputBindingDescription();
  binding.binding = bindingID;
  binding.stride = 4;
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
  vkCreateBuffer(this.device, bufferInfo, null, buffer);

  
  let memoryRequirements = new VkMemoryRequirements()
  vkGetBufferMemoryRequirements(this.device, buffer, memoryRequirements);

  
  let memoryAllocateInfo = new VkMemoryAllocateInfo();
  memoryAllocateInfo.allocationSize = memoryRequirements.size;
  memoryAllocateInfo.memoryTypeIndex = this.findMemoryTypeIndex(
    memoryRequirements.memoryTypeBits,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );

  let bufferHandle = {
    bindingInfo: binding,
    attributeInfo: attribute,
    data: null,
    buffer: buffer,
    id: -1,
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}
export function updateBuffer(buffer, data, offset, length) {

}
export function destroyBuffer(handle) {
  if (handle.id === -1) return;
  this.bufferChanged = true;
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