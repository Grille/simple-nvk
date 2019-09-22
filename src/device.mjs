import nvk from "nvk";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"

import Handle from "./handles/handle.mjs";
import BufferHandle from "./handles/buffer.mjs";
import CommandBufferHandle from "./handles/command.mjs";
import ComputePipelineHandle from "./handles/compute-pipeline.mjs";
import FenceHandle from "./handles/fence.mjs";
import FramebufferHandle from "./handles/framebuffer.mjs";
import ImageViewHandle from "./handles/image-view.mjs";
import PipelineLayoutHandle from "./handles/pipeline-layout.mjs";
import RenderPassHandle from "./handles/render-pass.mjs";
import RenderPipelineHandle from "./handles/render-pipeline.mjs";
import SemaphoreHandle from "./handles/semaphore.mjs";
import ShaderHandle from "./handles/shader.mjs";
import SurfaceHandle from "./handles/surface.mjs";
import SwapchainHandle from "./handles/swapchain.mjs";

export default class DeviceHandle extends Handle{
  constructor(owner){
    super(owner)
    this.id=-1;
    this.instance = owner.instance;
    this.device = owner.device;
    this.physicalDevice = owner.physicalDevice;
    this.commandPool = owner.commandPool;
    this.queue = owner.queue;
    this.window = owner.window;
  }

  destroy() {
    vkDeviceWaitIdle(this.device);
    this.super_destroy();
  }

  createBuffer(createInfo) { return this.create(BufferHandle, createInfo); }

  createCommandBuffer(createInfo) { return this.create(CommandBufferHandle, createInfo); }

  createComputePipeline(createInfo) { return this.create(ComputePipelineHandle, createInfo); }

  createFence(createInfo) { return this.create(FenceHandle, createInfo); }

  createFramebuffer(createInfo) { return this.create(FramebufferHandle, createInfo); }

  createImageView(createInfo) { return this.create(ImageViewHandle, createInfo); }

  createPipelineLayout(createInfo) { return this.create(PipelineLayoutHandle, createInfo); }

  createRenderPass(createInfo) { return this.create(RenderPassHandle, createInfo); }

  createRenderPipeline(createInfo) { return this.create(RenderPipelineHandle, createInfo); }

  createSemaphore(createInfo) { return this.create(SemaphoreHandle, createInfo); }

  createShader(createInfo) { return this.create(ShaderHandle, createInfo); }

  createSurface(createInfo) { return this.create(SurfaceHandle, createInfo); }

  createSwapchain(createInfo) { return this.create(SwapchainHandle, createInfo); }

  create(Type, createInfo) {
    let handle = new Type(this, createInfo);
    pushHandle(this, handle);
    return handle;
  }

  submit(submitInfo) {
    let { commandBuffer, waitSemaphore = null, signalSemaphore = null, signalFence = {}, blocking = false } = submitInfo;
    let { vkFence = null } = signalFence;
  
    let vkSubmitInfo = new VkSubmitInfo();
    vkSubmitInfo.pWaitDstStageMask = new Int32Array([VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT]);
    vkSubmitInfo.commandBufferCount = 1;
    vkSubmitInfo.pCommandBuffers = [commandBuffer.vkCommandBuffer];
    if (waitSemaphore !== null) {
      vkSubmitInfo.waitSemaphoreCount = 1;
      vkSubmitInfo.pWaitSemaphores = [waitSemaphore.vkSemaphore];
    }
    if (signalSemaphore !== null) {
      vkSubmitInfo.signalSemaphoreCount = 1;
      vkSubmitInfo.pSignalSemaphores = [signalSemaphore.vkSemaphore];
    }
  
    if (blocking) {
      let fence = this.createFence();
    
      let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], fence.vkFence);
      assertVulkan(result);
      fence.wait(60 * 1E3);
      fence.destroy();
    }
    else {
      let result = vkQueueSubmit(this.queue, 1, [vkSubmitInfo], vkFence);
      assertVulkan(result);
    }
  }

  createViewport(snvk) {
    let viewport = new VkViewport();
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = snvk.window.width;
    viewport.height = snvk.window.height;
    viewport.minDepth = 0;
    viewport.maxDepth = 1;

    let scissor = new VkRect2D();
    scissor.offset.x = 0;
    scissor.offset.y = 0;
    scissor.extent.width = snvk.window.width;
    scissor.extent.height = snvk.window.height;

    let viewportCreateInfo = new VkPipelineViewportStateCreateInfo();
    viewportCreateInfo.viewportCount = 1;
    viewportCreateInfo.pViewports = [viewport];
    viewportCreateInfo.scissorCount = 1;
    viewportCreateInfo.pScissors = [scissor];

    return viewportCreateInfo;
  }
}