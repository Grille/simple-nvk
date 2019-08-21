import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let imageViewHandles = [];

export function createImageView(createInfo){
  let { image} = createInfo;

  let imageViewCreateInfo = new VkImageViewCreateInfo();
  imageViewCreateInfo.image = image;
  imageViewCreateInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
  imageViewCreateInfo.format = VK_FORMAT_B8G8R8A8_UNORM;
  imageViewCreateInfo.components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
  imageViewCreateInfo.components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
  imageViewCreateInfo.components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
  imageViewCreateInfo.components.a = VK_COMPONENT_SWIZZLE_IDENTITY;
  imageViewCreateInfo.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
  imageViewCreateInfo.subresourceRange.baseMipLevel = 0;
  imageViewCreateInfo.subresourceRange.levelCount = 1;
  imageViewCreateInfo.subresourceRange.baseArrayLayer = 0;
  imageViewCreateInfo.subresourceRange.layerCount = 1;

  let imageView = new VkImageView();
  vkCreateImageView(this.device, imageViewCreateInfo, null, imageView);

  let handle = {
    imageView:imageView,
  }

  pushHandle(this.imageViewHandles, handle);

  return handle;
}

export function destroyImageView(handle){
  if (handle.id === -1) return
  vkDestroyImageView(this.device, handle.imageView, null);
  deleteHandle(this.framebufferHandles, handle);
}