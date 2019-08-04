import nvk from "nvk"
import { InitializedArray } from "./utils.mjs"
Object.assign(global, nvk);

function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

export function createSwapchain() {
  let swapchainCreateInfo = new VkSwapchainCreateInfoKHR();
  swapchainCreateInfo.surface = this.surface;
  swapchainCreateInfo.minImageCount = 2;
  swapchainCreateInfo.imageFormat = VK_FORMAT_B8G8R8A8_UNORM;
  swapchainCreateInfo.imageColorSpace = VK_COLOR_SPACE_SRGB_NONLINEAR_KHR;
  swapchainCreateInfo.imageExtent = new VkExtent2D({ width: this.window.width, height: this.window.height });
  swapchainCreateInfo.imageArrayLayers = 1;
  swapchainCreateInfo.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
  swapchainCreateInfo.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
  swapchainCreateInfo.queueFamilyIndexCount = 0;
  swapchainCreateInfo.pQueueFamilyIndices = null;
  swapchainCreateInfo.preTransform = VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR;
  swapchainCreateInfo.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
  swapchainCreateInfo.presentMode = VK_PRESENT_MODE_FIFO_KHR;
  swapchainCreateInfo.clipped = true;
  swapchainCreateInfo.oldSwapchain = null;

  this.swapchain = new VkSwapchainKHR();
  vkCreateSwapchainKHR(this.device, swapchainCreateInfo, null, this.swapchain);

  let swapchainImageCount = { $: 0 };
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, null);
  let swapchainImages = new InitializedArray(VkImage, swapchainImageCount.$);
  vkGetSwapchainImagesKHR(this.device, this.swapchain, swapchainImageCount, swapchainImages)

  this.swapImageViews = new InitializedArray(VkImageView, swapchainImageCount.$);
  for (let i = 0; i < this.swapImageViews.length; i++) {
    let imageViewCreateInfo = new VkImageViewCreateInfo();
    imageViewCreateInfo.image = swapchainImages[i];
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

    vkCreateImageView(this.device, imageViewCreateInfo, null, this.swapImageViews[i]);
  }
}