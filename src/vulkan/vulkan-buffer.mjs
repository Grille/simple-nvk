import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";

export let bufferChanged = false;
export let bufferHandles = [];
export let indexBufferHandle = null;

export function createBuffer(createInfo) {
  let { location, size, type, length, usage } = createInfo;

  let vkUsageBit = this.findVkBufferUsage(usage);

  let stride = type.size * size;
  let bufferSize = stride * length;
  console.log(bufferSize);
  let format = this.findVkFormat(type.size, size, type.type);

  let hostBuffer = this.createVkBuffer(
    bufferSize,
    VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );
  let localBuffer = this.createVkBuffer(
    bufferSize,
    vkUsageBit | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
  );

  let bufferHandle = {
    id: -1,
    location: -1,
    host: hostBuffer,
    local: localBuffer,
    usage: usage,
    format: format,
    length: length,
    size: size,
    stride: stride,
  }

  pushHandle(this.bufferHandles, bufferHandle);

  return bufferHandle;
}
export function bindBuffer(handle, location = -1) {
  if (handle.usage === this.BUFFER_USAGE_INDEX) {
    this.indexBufferHandle = handle;
  }
  else {
    if (location !== -1) {
      for (let i = 0; i < this.bufferHandles.length; i++) {
        let handle = this.bufferHandles[i];
        if (handle.location === location) {
          handle.location = -1;
        }
      }
    }
    handle.location = location;
  }
  this.bufferChanged = true;
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
    buffer:buffer,
    memory:memory,
  }
}
export function bufferSubData(handle, offsetDst, data, offsetSrc, length = null) {
  let dataPtr = { $: 0n };
  let { stride } = handle;
  if (length === null) length = (data.length / handle.size) | 0;
  let result = vkMapMemory(this.device, handle.host.memory, offsetDst * stride, length * stride, 0, dataPtr);
  this.assertVulkan(result);

  let verticesBuffer = ArrayBuffer.fromAddress(dataPtr.$, length * stride);
  let srcView = new Uint8Array(data.buffer);
  let dstView = new Uint8Array(verticesBuffer);
  for (let i = 0; i < length * stride; ++i) {
    dstView[i + offsetDst * stride] = srcView[i + offsetSrc * stride];
  };

  //let test = new Float64Array(dstView.buffer);
  //console.log(test);
  /*
  let mappedBuffer = ArrayBuffer.fromAddress(dataPtr.$, length*stride);
  let srcView = new Uint8Array(data.buffer);
  let dstView = new Uint8Array(mappedBuffer);
  dstView.set(srcView, 0x0);
  */
  
  vkUnmapMemory(this.device, handle.host.memory);

  this.copyBuffer(handle.host.buffer, handle.local.buffer, offsetDst * stride, length * stride);
}
export function readBuffer(handle, data, offset, length) {

}
export function copyBuffer(src, dst, offset, size) {
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
  vkFreeMemory(this.device, handle.host.memory);
  vkDestroyBuffer(this.device, handle.host.buffer, null);
  vkFreeMemory(this.device, handle.local.memory);
  vkDestroyBuffer(this.device, handle.local.buffer, null);
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
export function findVkBufferUsage(usage) {
  switch (usage) {
    case this.BUFFER_USAGE_VERTEX: return VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
    case this.BUFFER_USAGE_INDEX: return VK_BUFFER_USAGE_INDEX_BUFFER_BIT;
    case this.BUFFER_USAGE_COMPUTE: return VK_BUFFER_USAGE_STORAGE_BUFFER_BIT;
  }
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