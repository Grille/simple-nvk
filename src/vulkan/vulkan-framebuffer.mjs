import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let framebufferHandles = [];

export function createFramebuffer(createInfo) {
  let { pipeline, imageView, width, height } = createInfo;

  let framebuffer = new VkFramebuffer();

  let framebufferCreateInfo = new VkFramebufferCreateInfo();
  framebufferCreateInfo.renderPass = pipeline.renderPass;
  framebufferCreateInfo.attachmentCount = 1;
  framebufferCreateInfo.pAttachments = [imageView.imageView];
  framebufferCreateInfo.width = width;
  framebufferCreateInfo.height = height;
  framebufferCreateInfo.layers = 1;

  let result = vkCreateFramebuffer(this.device, framebufferCreateInfo, null, framebuffer);
  this.assertVulkan(result);

  let handle = {
    framebuffer: framebuffer,
    width: width,
    height: height,
  }

  pushHandle(this.framebufferHandles, handle);

  return handle;
}

export function destroyFramebuffer(handle) {
  if (handle.id === -1) return
  vkDestroyFramebuffer(this.device, handle.framebuffer, null);
  deleteHandle(this.framebufferHandles, handle);
}