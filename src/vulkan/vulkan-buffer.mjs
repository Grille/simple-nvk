import * as utils from "./utils.mjs"
import { pushHandle } from "./utils.mjs";

export let bufferHandles;

export function createBuffer(location,type,vec){
  this.pipelineInputChanged = true;

  let binding = new VkVertexInputBindingDescription();
  binding.binding = this.binding;
  binding.stride = 4;
  binding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;

  let attribute = new VkVertexInputAttributeDescription();
  attribute.location = 0;
  attribute.binding = this.binding;
  attribute.format = VK_FORMAT_R32G32_SFLOAT;
  attribute.offset = 0;

  let bufferCreateInfo = new VkBufferCreateInfo();
  buffer.size = 0;
  buffer.usage = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
  buffer.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
  buffer.queueFamilyIndexCount = 0;
  buffer.pQueueFamilyIndices = null;

  let buffer = new VkBuffer();
  vkCreateBuffer(this.device, bufferCreateInfo, null, buffer);

  let memoryRequirements = new VkMemoryRequirements()
  vkGetBufferMemoryRequirements(this.device, buffer, memoryRequirements);
  
  let memoryAllocateInfo = new VkMemoryAllocateInfo();
  memoryAllocateInfo.allocationSize = memoryRequirements.size;
  memoryAllocateInfo.memoryTypeIndex = 0;

  let bufferHandle = {
    binding: location,
    data: null,
    buffer: buffer,
  }

  utils.pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}
export function updateBuffer(buffer, data, offset, length) {

}
export function destroyBuffer(handle) {
  this.pipelineInputChanged = true;
  vkDestroyBuffer(this.device, handle.buffer, null);
  utils.deleteHandle(bufferHandles, handle);
}
export function findMemoryTypeIndex(typeFilter, properties) {
  let memoryProperties = new VkPhysicalDeviceMemoryProperties();
  vkGetPhysicalDeviceMemoryProperties(this.physicalDevice, memoryProperties);
  for (let i = 0; i < memoryProperties.memoryTypeCount; i++) {
    if (typeFilter & (1 << i) && memoryProperties.memoryTypes[i].p) {
      return i;
    }
  }
}