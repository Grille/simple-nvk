import { assertVulkan } from "../utils.mjs";
import Handle from "./handle.mjs";

export default class FenceHandle extends Handle{
  constructor(snvk, createInfo) {
    super(snvk);

    let fenceCreateInfo = new VkFenceCreateInfo();
    let fence = new VkFence();
    vkCreateFence(this.device, fenceCreateInfo, null, fence);
  
    this.vkFence = fence;
  }
  destroy() {
    this.super_destroy();
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