import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "../utils.mjs"
import Handle from "./handle.mjs";

export let framebufferHandles = [];

export function createFramebuffer(createInfo) {
  let handle = new FramebufferHandle(this, createInfo);
  pushHandle(this.framebufferHandles, handle);
  return handle;
}

export function destroyFramebuffer(handle) {
  if (handle.id === -1) return
  handle.destroy();
  deleteHandle(this.framebufferHandles, handle);
}

class FramebufferHandle extends Handle{
  constructor(snvk, { renderPass, imageView, width, height }) {
    super(snvk);

    let framebuffer = new VkFramebuffer();

    let framebufferCreateInfo = new VkFramebufferCreateInfo();
    framebufferCreateInfo.renderPass = renderPass.vkRenderPass;
    framebufferCreateInfo.attachmentCount = 1;
    framebufferCreateInfo.pAttachments = [imageView.vkImageView];
    framebufferCreateInfo.width = width;
    framebufferCreateInfo.height = height;
    framebufferCreateInfo.layers = 1;

    let result = vkCreateFramebuffer(this.device, framebufferCreateInfo, null, framebuffer);
    assertVulkan(result);

    this.vkFramebuffer = framebuffer;
    this.width = width;
    this.height = height;
  }
  destroy(){
    vkDestroyFramebuffer(this.device, this.vkFramebuffer, null);
  }
}