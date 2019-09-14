import { pushHandle, deleteHandle } from "../utils.mjs";
import Handle from "./handle.mjs";

export let fenceHandles = [];

export function createFence() {
  let handle = new FenceHandle(this);
  pushHandle(this.fenceHandles, handle);
  return handle;
}
export function destroyFence(handle) {
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(this.fenceHandles, handle);
}

export class FenceHandle extends Handle{
  constructor(snvk, createInfo) {
    super(snvk);

    let fenceCreateInfo = new VkFenceCreateInfo();
    let fence = new VkFence();
    vkCreateFence(this.device, fenceCreateInfo, null, fence);
  
    this.vkFence = fence;
  }
  destroy() {
    vkDestroyFence(this.device, this.vkFence, null);
  }
  wait(timeout) {
    vkWaitForFences(this.device, 1, [this.vkFence], true, timeout * 1E6);
  }
  reset() {
    vkResetFences(this.device, 1, [this.vkFence]);
  }
}

export function waitForIdle() {
  vkDeviceWaitIdle(this.device);
}