import { assertVulkan } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class RenderPassHandle extends Handle {
  constructor(snvk, { backgroundColor = [0, 0, 0, 1] }) {
    super(snvk);
    let renderPass = new VkRenderPass();

    let attachmentDescription = new VkAttachmentDescription();
    attachmentDescription.flags = 0;
    attachmentDescription.format = VK_FORMAT_B8G8R8A8_UNORM;
    attachmentDescription.samples = VK_SAMPLE_COUNT_1_BIT;
    attachmentDescription.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
    attachmentDescription.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
    attachmentDescription.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
    attachmentDescription.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
    attachmentDescription.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
    attachmentDescription.finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR;
  
    let attachmentReference = new VkAttachmentReference();
    attachmentReference.attachment = 0;
    attachmentReference.layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
  
    let subpassDescription = new VkSubpassDescription();
    subpassDescription.pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS;
    subpassDescription.inputAttachmentCount = 0;
    subpassDescription.pInputAttachments = null;
    subpassDescription.colorAttachmentCount = 1;
    subpassDescription.pColorAttachments = [attachmentReference];
    subpassDescription.pResolveAttachments = null;
    subpassDescription.pDepthStencilAttachment = null;
    subpassDescription.preserveAttachmentCount = 0;
    subpassDescription.pPreserveAttachments = null;
  
    let subpassDependency = new VkSubpassDependency();
    subpassDependency.srcSubpass = VK_SUBPASS_EXTERNAL;
    subpassDependency.dstSubpass = 0;
    subpassDependency.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
    subpassDependency.dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
    subpassDependency.srcAccessMask = 0;
    subpassDependency.dstAccessMask = VK_ACCESS_COLOR_ATTACHMENT_READ_BIT | VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
    subpassDependency.dependencyFlags = 0;
  
    let renderPassCreateInfo = new VkRenderPassCreateInfo();
    renderPassCreateInfo.attachmentCount = 1;
    renderPassCreateInfo.pAttachments = [attachmentDescription];
    renderPassCreateInfo.subpassCount = 1;
    renderPassCreateInfo.pSubpasses = [subpassDescription];
    renderPassCreateInfo.dependencyCount = 1;
    renderPassCreateInfo.pDependencies = [subpassDependency];
  
    let result = vkCreateRenderPass(this.device, renderPassCreateInfo, null, renderPass);
    assertVulkan(result);

    this.vkRenderPass = renderPass;
    this.backgroundColor = backgroundColor;
  }
  destroy(){
    vkDestroyRenderPass(this.device, this.vkRenderPass, null);
  }
}