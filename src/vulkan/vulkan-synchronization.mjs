import { pushHandle, deleteHandle } from "./utils.mjs";

export let semaphoreHandles = [];
export let fenceHandles = [];

export function createSemaphore() {
  let semaphoreCreateInfo = new VkSemaphoreCreateInfo();
  let semaphore = new VkSemaphore();
  vkCreateSemaphore(this.device, semaphoreCreateInfo, null, semaphore);

  let handle = {
    vkSemaphore: semaphore,
  }

  pushHandle(this.semaphoreHandles, handle);

  return handle;
}

export function destroySemaphore(handle) {
  if (handle.id === -1) return;
  vkDestroySemaphore(this.device, handle.vkSemaphore, null);
  deleteHandle(this.semaphoreHandles, handle);
}


export function createFence() {
  let fenceCreateInfo = new VkFenceCreateInfo();
  let fence = new VkFence();
  vkCreateFence(this.device, fenceCreateInfo, null, fence);

  let handle = {
    vkFence: fence,
  }

  pushHandle(this.fenceHandles, handle);

  return handle;
}

export function waitForFence(handle,timeout){
  vkWaitForFences(this.device, 1, [handle.vkFence], true, timeout * 1E6);
}

export function destroyFence(handle) {
  if (handle.id === -1) return;
  vkDestroyFence(this.device, handle.vkFence, null);
  deleteHandle(this.fenceHandles, handle);
}