import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];
export let indexBufferHandle = null;

export function createBuffer(createInfo) {
  let { size, usage, readable = false} = createInfo;

  let vkUsageBits = this.getVkBufferUsageBits(usage, readable);

  let hostBuffer = this.createVkBuffer(
    size,
    vkUsageBits.host,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );
  let localBuffer = this.createVkBuffer(
    size,
    vkUsageBits.local,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
  );

  let bufferHandle = {
    id: -1,
    vksHost: hostBuffer,
    vksLocal: localBuffer,
    usage: usage,
    size: size,
    readable: readable,
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
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
export function bufferSubData(handle, offsetDst, data, offsetSrc, length = null) {
  let dataPtr = { $: 0n };
  if (length === null) length = data.buffer.length;
  let result = vkMapMemory(this.device, handle.vksHost.vkMemory, offsetDst, length, 0, dataPtr);
  this.assertVulkan(result);

  let buffer = ArrayBuffer.fromAddress(dataPtr.$, length);
  let srcView = new Uint8Array(data.buffer);
  let dstView = new Uint8Array(buffer);
  for (let i = 0; i < length; ++i) {
    dstView[i + offsetDst] = srcView[i + offsetSrc];
  };

  //let test = new Float64Array(dstView.buffer);
  //console.log(test);
  /*
  let mappedBuffer = ArrayBuffer.fromAddress(dataPtr.$, length*stride);
  let srcView = new Uint8Array(data.buffer);
  let dstView = new Uint8Array(mappedBuffer);
  dstView.set(srcView, 0x0);
  */
  
  vkUnmapMemory(this.device, handle.vksHost.vkMemory);

  this.copyVkBuffer(handle.vksHost.vkBuffer, handle.vksLocal.vkBuffer, offsetDst, length);
}
export function bufferReadData(handle, offset = 0, length = null) {
  let dataPtr = { $: 0n };
  if (length === null) length = handle.length;

  this.copyVkBuffer(handle.vksLocal.vkBuffer, handle.vksHost.vkBuffer, offset, length);

  let result = vkMapMemory(this.device, handle.vksHost.vkMemory, offset, length, 0, dataPtr);
  this.assertVulkan(result);

  let buffer = ArrayBuffer.fromAddress(dataPtr.$, length);

  return buffer;
}
export function copyBuffer(srcHandle, dstHandle, offset, size) {
  this.copyVkBuffer(srcHandle.vksLocal.vkBuffer, dstHandle.vksLocal.vkBuffer, offset, size);
}
export function copyVkBuffer(src, dst, offset, size) {
  let commandBufferAllocateInfo = new VkCommandBufferAllocateInfo();
  commandBufferAllocateInfo.commandPool = this.commandPool;
  commandBufferAllocateInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
  commandBufferAllocateInfo.commandBufferCount = 1;

  let commandBuffer = new VkCommandBuffer();
  let result = vkAllocateCommandBuffers(this.device, commandBufferAllocateInfo, [commandBuffer]);
  this.assertVulkan(result);

  let commandBufferBeginInfo = new VkCommandBufferBeginInfo();
  commandBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
  commandBufferBeginInfo.pInheritanceInfo = null;

  result = vkBeginCommandBuffer(commandBuffer, commandBufferBeginInfo);
  this.assertVulkan(result);

  let bufferCopy = new VkBufferCopy();
  bufferCopy.srcOffset = offset;
  bufferCopy.dstOffset = offset;
  bufferCopy.size = size;

  vkCmdCopyBuffer(commandBuffer, src, dst, 1, [bufferCopy]);

  result = vkEndCommandBuffer(commandBuffer);
  this.assertVulkan(result);

  let submitInfo = new VkSubmitInfo();
  submitInfo.waitSemaphoreCount = 0;
  submitInfo.pWaitSemaphores = null;
  submitInfo.pWaitDstStageMask = null;
  submitInfo.commandBufferCount = 1;
  submitInfo.pCommandBuffers = [commandBuffer];
  submitInfo.signalSemaphoreCount = 0;
  submitInfo.pSignalSemaphores = null;

  result = vkQueueSubmit(this.queue, 1, [submitInfo], null);
  this.assertVulkan(result);

  vkQueueWaitIdle(this.queue);

  vkFreeCommandBuffers(this.device, this.commandPool, 1, [commandBuffer]);
}
export function destroyBuffer(handle) {
  if (handle.id === -1) return;
  this.bufferChanged = true;
  vkFreeMemory(this.device, handle.vksHost.vkMemory);
  vkDestroyBuffer(this.device, handle.vksHost.vkBuffer, null);
  vkFreeMemory(this.device, handle.vksLocal.vkMemory);
  vkDestroyBuffer(this.device, handle.vksLocal.vkBuffer, null);
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
  switch (usage) {
    case this.BUFFER_USAGE_VERTEX: local |= VK_BUFFER_USAGE_VERTEX_BUFFER_BIT; break;
    case this.BUFFER_USAGE_INDEX: local |= VK_BUFFER_USAGE_INDEX_BUFFER_BIT; break;
    case this.BUFFER_USAGE_STORAGE: local |= VK_BUFFER_USAGE_STORAGE_BUFFER_BIT; break;
    case this.BUFFER_USAGE_UNIFORM: local |= VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT; break;
  }
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