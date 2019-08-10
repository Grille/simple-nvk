import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];

export function createBuffer(location = 0, size = 1, vector = 1,type=0, length = 1) {
  this.bufferChanged = true;

  let result = 0;

  let stride = size * vector;
  let bufferSize = stride * length;
  let format = this.findVkFormat(size, vector, type);

  let bindingID = location;
  let binding = new VkVertexInputBindingDescription();
  binding.binding = bindingID;
  binding.stride = stride;
  binding.inputRate = VK_VERTEX_INPUT_RATE_VERTEX; 

  let attribute = new VkVertexInputAttributeDescription();
  attribute.location = location;
  attribute.binding = bindingID;
  attribute.format = format;
  attribute.offset = 0;

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
    buffer: buffer,
    id: -1,
    length: length,
    typeInfo: {
      size, vector, type, stride
    },
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}
export function updateBuffer(handle, data, offset, length) {
  let dataPtr = { $: 0n };
  let { stride } = handle.typeInfo;
  let result = vkMapMemory(this.device, handle.memory, offset * stride, length * stride, 0, dataPtr);
  this.assertVulkan(result);

  let verticesBuffer = ArrayBuffer.fromAddress(dataPtr.$, length * stride);
  let srcView = new Uint8Array(data.buffer);
  let dstView = new Uint8Array(verticesBuffer);
  for (let i = 0; i < length * stride; ++i) {
    dstView[i] = srcView[i];
  };

  /*
  let mappedBuffer = ArrayBuffer.fromAddress(dataPtr.$, length*stride);
  let srcView = new Uint8Array(data.buffer);
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
export function findVkFormat(size, vec, type) {
  let enumName = `VK_FORMAT_`
  size*=8;
  switch (vec) {
    case 1: enumName += `R${size}`; break;
    case 2: enumName += `R${size}G${size}`; break;
    case 3: enumName += `R${size}G${size}B${size}`; break;
    case 4: enumName += `R${size}G${size}B${size}A${size}`; break;
  }
  switch (type) {
    case this.UINT: enumName += `_UINT`; break;
    case this.INT: enumName += `_SINT`; break;
    case this.FLOAT: enumName += `_SFLOAT`; break;
  }
  //console.log(enumName)
  return nvk[enumName];
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