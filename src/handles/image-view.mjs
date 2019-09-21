import { assertVulkan } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class ImageViewHandle extends Handle {
  constructor(snvk, { image }) {
    super(snvk);
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

    this.vkImageView = imageView;
  }
  destroy() {
    this.super_destroy();
    vkDestroyImageView(this.device, this.vkImageView, null);
  }
}