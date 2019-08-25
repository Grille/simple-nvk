import { pushHandle, deleteHandle } from "./utils.mjs";

export let semaphoreHandles = [];

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
  vkDestroySemaphore(this.device, handle.vkSemaphore, null);
  deleteHandle(this.semaphoreHandles, handle);
}