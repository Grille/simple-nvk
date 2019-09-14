import nvk from "nvk"
import Handle from "./handle.mjs";
import { pushHandle, deleteHandle, assertVulkan } from "../utils.mjs";

export let bufferHandles = [];

export function createBuffer(createInfo) {
  return new BufferHandle(this, createInfo)
}
export function destroyBuffer(handle) {
  handle.destroy();
}

class BufferHandle extends Handle {
  constructor(snvk, { size, usage, staging = snvk.BUFFER_STAGING_DYNAMIC, readable = false }) {
    super(snvk);

    let vkUsageBits = getVkBufferUsageBits(this.snvk, usage, readable);

    let hostBuffer = null;
    if (staging === snvk.BUFFER_STAGING_STATIC) {
      hostBuffer = createVkHostBuffer(this.snvk, size, vkUsageBits.host);
    }
    let localBuffer = createVkBuffer(this.snvk,
      size,
      vkUsageBits.local,
      VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
    );

    this.id = -1;
    this.vksHost = hostBuffer;
    this.vksLocal = localBuffer;
    this.vkUsageBits = vkUsageBits;
    this.staging = staging;
    this.usage = usage;
    this.size = size;
    this.readable = readable;

    pushHandle(snvk.bufferHandles, this);
  }

  destroy() {
    let { snvk } = this;
    if (this.id === -1) return;
    if (this.staging === snvk.BUFFER_STAGING_STATIC) {
      destroyVkBuffer(snvk, this.vksHost);
    }
    destroyVkBuffer(snvk, this.vksLocal);
    deleteHandle(snvk.bufferHandles, this);
  }

  subData(offsetDst, data, offsetSrc, length = null) {
    let dataPtr = { $: 0n };
    if (length === null) length = data.buffer.size;

    let offsetHost = offsetDst;
    if (this.staging === this.snvk.BUFFER_STAGING_DYNAMIC) {
      this.vksHost = createVkHostBuffer(this.snvk, length, this.vkUsageBits.host);
      offsetHost = 0;
    }

    let result = vkMapMemory(this.device, this.vksHost.vkMemory, offsetHost, length, 0, dataPtr);
    assertVulkan(result);

    let dstView = new Uint8Array(ArrayBuffer.fromAddress(dataPtr.$, length));
    let srcView = new Uint8Array(data.buffer).subarray(offsetSrc, offsetSrc + length);
    dstView.set(srcView, 0);

    vkUnmapMemory(this.device, this.vksHost.vkMemory);

    copyVkBuffer(this.snvk, this.vksHost.vkBuffer, offsetHost, this.vksLocal.vkBuffer, offsetDst, length);

    if (this.staging === this.snvk.BUFFER_STAGING_DYNAMIC) {
      destroyVkBuffer(this.snvk, this.vksHost);
    }
  }
  readData(offset = 0, length = null) {
    let dataPtr = { $: 0n };
    if (length === null) length = this.size;

    let offsetHost = offset;
    if (this.staging === this.snvk.BUFFER_STAGING_DYNAMIC) {
      this.vksHost = createVkHostBuffer(this.snvk, length, this.vkUsageBits.host);
      offsetHost = 0;
    }

    copyVkBuffer(this.snvk, this.vksLocal.vkBuffer, offset, this.vksHost.vkBuffer, offsetHost, length);

    let result = vkMapMemory(this.device, this.vksHost.vkMemory, offsetHost, length, 0, dataPtr);
    assertVulkan(result);

    let buffer = ArrayBuffer.fromAddress(dataPtr.$, length);

    if (this.staging === this.snvk.BUFFER_STAGING_DYNAMIC) {
      destroyVkBuffer(this.snvk, this.vksHost);
    }

    return buffer;
  }
  copy(srcHandle, offsetSrc, dstHandle, offsetDst, size) {
    copyVkBuffer(this.snvk, srcHandle.vksLocal.vkBuffer, offsetSrc, dstHandle.vksLocal.vkBuffer, offsetDst, size);
  }

  getBinding(buffer, binding = 0, stride = 1) {
    return {
      buffer,
      binding,
      stride,
    }
  }

  getAttribute(binding, location, type, size, offset = 0) {
    let format = findVkFormat(this.snvk, type >> 4, size, type & 15);
    return {
      binding,
      location,
      format,
      offset,
    }
  }

  getDescriptor(buffer, binding, type) {
    return {
      buffer,
      binding,
      type,
    }
  }
}

function createVkHostBuffer(snvk, size, bufferUsageFlags) {
  return createVkBuffer(snvk,
    size,
    bufferUsageFlags,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
  );
}

function copyVkBuffer(snvk, src, offsetSrc, dst, offsetDst, size) {
  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_ONE_TIME,
  }
  let command = snvk.createCommandBuffer(commandCreateInfo);

  command.begin();
  let { vkCommandBuffer } = command;

  let bufferCopy = new VkBufferCopy();
  bufferCopy.srcOffset = offsetSrc;
  bufferCopy.dstOffset = offsetDst;
  bufferCopy.size = size;
  vkCmdCopyBuffer(vkCommandBuffer, src, dst, 1, [bufferCopy]);

  command.end();

  let submitInfo = {
    commandBuffer: command,
    blocking: true,
  }
  snvk.submit(submitInfo);

  snvk.destroyCommandBuffer(command);
}

function createVkBuffer(snvk, bufferSize, bufferUsageFlags, memoryPropertieFlags) {
  let bufferInfo = new VkBufferCreateInfo();
  bufferInfo.size = bufferSize;
  bufferInfo.usage = bufferUsageFlags;
  bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
  bufferInfo.queueFamilyIndexCount = 0;
  bufferInfo.pQueueFamilyIndices = null;

  let buffer = new VkBuffer();
  let result = vkCreateBuffer(snvk.device, bufferInfo, null, buffer);
  assertVulkan(result);

  let memoryRequirements = new VkMemoryRequirements()
  vkGetBufferMemoryRequirements(snvk.device, buffer, memoryRequirements);

  let memoryAllocateInfo = new VkMemoryAllocateInfo();
  memoryAllocateInfo.allocationSize = memoryRequirements.size;
  memoryAllocateInfo.memoryTypeIndex = findVkMemoryTypeIndex(snvk,
    memoryRequirements.memoryTypeBits, memoryPropertieFlags
  );

  let memory = new VkDeviceMemory();
  result = vkAllocateMemory(snvk.device, memoryAllocateInfo, null, memory);
  assertVulkan(result);

  vkBindBufferMemory(snvk.device, buffer, memory, 0n);

  return {
    vkBuffer: buffer,
    vkMemory: memory,
  }
}

function destroyVkBuffer(snvk, buffer) {
  vkFreeMemory(snvk.device, buffer.vkMemory);
  vkDestroyBuffer(snvk.device, buffer.vkBuffer, null);
}

function findVkFormat(snvk, size, vec, type) {
  let enumName = `VK_FORMAT_`
  size *= 8;
  switch (vec) {
    case 1: enumName += `R${size}`; break;
    case 2: enumName += `R${size}G${size}`; break;
    case 3: enumName += `R${size}G${size}B${size}`; break;
    case 4: enumName += `R${size}G${size}B${size}A${size}`; break;
  }
  switch (type) {
    case snvk.UINT: enumName += `_UINT`; break;
    case snvk.INT: enumName += `_SINT`; break;
    case snvk.FLOAT: enumName += `_SFLOAT`; break;
  }
  return nvk[enumName];
}

function getVkBufferUsageBits(snvk, usage, readable) {
  let host = VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
  let local = VK_BUFFER_USAGE_TRANSFER_DST_BIT;
  if (readable) {
    host |= VK_BUFFER_USAGE_TRANSFER_DST_BIT;
    local |= VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
  }
  local |= usage;
  return { host, local };
}

function findVkMemoryTypeIndex(snvk, typeFilter, properties) {
  let memoryProperties = new VkPhysicalDeviceMemoryProperties();
  vkGetPhysicalDeviceMemoryProperties(snvk.physicalDevice, memoryProperties);
  for (let i = 0; i < memoryProperties.memoryTypeCount; i++) {
    if (typeFilter & (1 << i) && ((memoryProperties.memoryTypes[i].propertyFlags & properties))) {
      return i;
    }
  }
}