import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];
export let indexBufferHandle = null;

export function createBuffer(createInfo) {
  let { size, usage, staging = this.BUFFER_STAGING_DYNAMIC, readable = false } = createInfo;

  let vkUsageBits = this.getVkBufferUsageBits(usage, readable);

  let hostBuffer = null;
  if (staging === this.BUFFER_STAGING_STATIC) {
    hostBuffer = this.createVkHostBuffer(size, vkUsageBits.host);
  }
  let localBuffer = this.createVkBuffer(
    size,
    vkUsageBits.local,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
  );

  let bufferHandle = {
    id: -1,
    vksHost: hostBuffer,
    vksLocal: localBuffer,
    vkUsageBits: vkUsageBits,
    staging: staging,
    usage: usage,
    size: size,
    readable: readable,
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}

export function createVkHostBuffer(size, bufferUsageFlags) {
  return this.createVkBuffer(
    size,
    bufferUsageFlags,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );
}

export function createVkBuffer(bufferSize,bufferUsageFlags,memoryPropertieFlags){
  let bufferInfo = new VkBufferCreateInfo();
  bufferInfo.size = bufferSize;
  bufferInfo.usage = bufferUsageFlags;
  bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
  bufferInfo.queueFamilyIndexCount = 0;
  bufferInfo.pQueueFamilyIndices = null;

  let buffer = new VkBuffer();
  let result = vkCreateBuffer(this.device, bufferInfo, null, buffer);
  this.assertVulkan(result);
  
  let memoryRequirements = new VkMemoryRequirements()
  vkGetBufferMemoryRequirements(this.device, buffer, memoryRequirements);
  
  let memoryAllocateInfo = new VkMemoryAllocateInfo();
  memoryAllocateInfo.allocationSize = memoryRequirements.size;
  memoryAllocateInfo.memoryTypeIndex = this.findMemoryTypeIndex(
    memoryRequirements.memoryTypeBits, memoryPropertieFlags
  );

  let memory = new VkDeviceMemory();
  result = vkAllocateMemory(this.device, memoryAllocateInfo, null, memory);
  this.assertVulkan(result);

  vkBindBufferMemory(this.device, buffer, memory, 0n);

  return {
    vkBuffer: buffer,
    vkMemory: memory,
  }
}
export function destroyVkBuffer(buffer) {
  vkFreeMemory(this.device, buffer.vkMemory);
  vkDestroyBuffer(this.device, buffer.vkBuffer, null);
}
export function bufferSubData(handle, offsetDst, data, offsetSrc, length = null) {
  let dataPtr = { $: 0n };
  if (length === null) length = data.buffer.size;

  let offsetHost = offsetDst;
  if (handle.staging === this.BUFFER_STAGING_DYNAMIC) {
    handle.vksHost = this.createVkHostBuffer(length, handle.vkUsageBits.host);
    offsetHost = 0;
  }

  let result = vkMapMemory(this.device, handle.vksHost.vkMemory, offsetHost, length, 0, dataPtr);
  this.assertVulkan(result);

  let dstView = new Uint8Array(ArrayBuffer.fromAddress(dataPtr.$, length));
  let srcView = new Uint8Array(data.buffer).subarray(offsetSrc, offsetSrc + length);
  dstView.set(srcView, 0);

  vkUnmapMemory(this.device, handle.vksHost.vkMemory);

  this.copyVkBuffer(handle.vksHost.vkBuffer, handle.vksLocal.vkBuffer, offsetHost, offsetDst, length);

  if (handle.staging === this.BUFFER_STAGING_DYNAMIC) {
    this.destroyVkBuffer(handle.vksHost);
  }
}
export function bufferReadData(handle, offset = 0, length = null) {
  let dataPtr = { $: 0n };
  if (length === null) length = handle.size;

  let offsetHost = offset;
  if (handle.staging === this.BUFFER_STAGING_DYNAMIC) {
    handle.vksHost = this.createVkHostBuffer(length, handle.vkUsageBits.host);
    offsetHost = 0;
  }

  this.copyVkBuffer(handle.vksLocal.vkBuffer, handle.vksHost.vkBuffer, offset, offsetHost, length);

  let result = vkMapMemory(this.device, handle.vksHost.vkMemory, offsetHost, length, 0, dataPtr);
  this.assertVulkan(result);

  let buffer = ArrayBuffer.fromAddress(dataPtr.$, length);

  if (handle.staging === this.BUFFER_STAGING_DYNAMIC) {
    this.destroyVkBuffer(handle.vksHost);
  }

  return buffer;
}
export function copyBuffer(srcHandle, dstHandle, offsetSrc,offsetDst, size) {
  this.copyVkBuffer(srcHandle.vksLocal.vkBuffer, dstHandle.vksLocal.vkBuffer, offsetSrc, offsetDst, size);
}
export function copyVkBuffer(src, dst, offsetSrc, offsetDst, size) {

  let commandCreateInfo = {
    level: this.COMMAND_LEVEL_PRIMARY,
    usage: this.COMMAND_USAGE_ONE_TIME,
  }
  let commandBuffer = this.createCommandBuffer(commandCreateInfo);
  this.cmdBegin(commandBuffer);
  let { vkCommandBuffer } = commandBuffer;

  let bufferCopy = new VkBufferCopy();
  bufferCopy.srcOffset = offsetSrc;
  bufferCopy.dstOffset = offsetDst;
  bufferCopy.size = size;
  vkCmdCopyBuffer(vkCommandBuffer, src, dst, 1, [bufferCopy]);

  this.cmdEnd(commandBuffer);

  let submitInfo = {
    commandBuffer: commandBuffer,
    blocking: true,
  }
  this.submit(submitInfo);

  this.destroyCommandBuffer(commandBuffer);
}
export function destroyBuffer(handle) {
  if (handle.id === -1) return;
  this.bufferChanged = true;
  if (handle.staging === this.BUFFER_STAGING_STATIC) {
    this.destroyVkBuffer(handle.vksHost);
  }
  this.destroyVkBuffer(handle.vksLocal);
  deleteHandle(this.bufferHandles, handle);
}
export function getAttribute(binding, location, type, size, offset = 0) {
  let format = this.findVkFormat(type >> 4, size, type & 15);
  return {
    binding,
    location,
    format,
    offset,
  }
}
export function getBinding(buffer, binding = 0, stride = 1) {
  return {
    buffer,
    binding,
    stride,
  }
}
export function getDescriptor(buffer, binding, type) {
  return {
    buffer,
    binding,
    type,
  }
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
  return nvk[enumName];
}
export function getVkBufferUsageBits(usage, readable) {
  let host = VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
  let local = VK_BUFFER_USAGE_TRANSFER_DST_BIT;
  if (readable) {
    host |= VK_BUFFER_USAGE_TRANSFER_DST_BIT;
    local |= VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
  }
  local |= usage;
  return { host, local };
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