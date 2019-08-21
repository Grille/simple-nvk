import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let framebufferHandles = [];

export function createFramebuffer(createInfo) {
  let { pipeline, imageView, width, height } = createInfo;

  let framebuffer = new VkFramebuffer();

  let framebufferCreateInfo = new VkFramebufferCreateInfo();
  framebufferCreateInfo.renderPass = pipeline.vkRenderPass;
  framebufferCreateInfo.attachmentCount = 1;
  framebufferCreateInfo.pAttachments = [imageView.vkImageView];
  framebufferCreateInfo.width = width;
  framebufferCreateInfo.height = height;
  framebufferCreateInfo.layers = 1;

  let result = vkCreateFramebuffer(this.device, framebufferCreateInfo, null, framebuffer);
  this.assertVulkan(result);

  let handle = {
    vkFramebuffer: framebuffer,
    width: width,
    height: height,
  }

  pushHandle(this.framebufferHandles, handle);

  return handle;
}

export function destroyFramebuffer(handle) {
  if (handle.id === -1) return
  vkDestroyFramebuffer(this.device, handle.vkFramebuffer, null);
  deleteHandle(this.framebufferHandles, handle);
}