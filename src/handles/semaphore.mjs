import { pushHandle, deleteHandle } from "../utils.mjs";
import Handle from "./handle.mjs";

export let semaphoreHandles = [];

export function createSemaphore() {
  let handle = new SemaphoreHandle(this);
  pushHandle(this.semaphoreHandles, handle);
  return handle;
}

export function destroySemaphore(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.semaphoreHandles, handle);
}

export class SemaphoreHandle extends Handle {
  constructor(snvk, createInfo) {
    super(snvk);

    let semaphoreCreateInfo = new VkSemaphoreCreateInfo();
    let semaphore = new VkSemaphore();
    vkCreateSemaphore(this.device, semaphoreCreateInfo, null, semaphore);

    this.vkSemaphore = semaphore;
  }
  destroy() {
    vkDestroySemaphore(this.device, this.vkSemaphore, null);
  }
}
