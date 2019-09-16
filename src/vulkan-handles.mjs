import { pushHandle, deleteHandle} from "./utils.mjs"

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
import SwapchainHandle from "./handles/swapchain.mjs";

export let bufferHandles = [];
export let commandBufferHandles = [];
export let computePipelineHandles = [];
export let fenceHandles = [];
export let framebufferHandles = [];
export let imageViewHandles = [];
export let pipelineLayoutHandles = [];
export let renderPassHandles = [];
export let renderPipelineHandles = [];
export let semaphoreHandles = [];
export let shaderHandles = [];
export let swapchainHandles = [];

export function destroyHandle(handle){
  if (handle.id === -1) return;
  handle.destroy();
  deleteHandle(handle.handleList, handle);
}
export function createBuffer(createInfo) {
  let handle = new BufferHandle(this, createInfo)
  pushHandle(this.bufferHandles, handle);
  return handle;
}

export function createCommandBuffer(createInfo) {
  let handle = new CommandBufferHandle(this, createInfo);
  pushHandle(this.commandBufferHandles, handle);
  return handle;
}

export function createComputePipeline(createInfo) {
  let handle = new ComputePipelineHandle(this, createInfo);
  pushHandle(this.computePipelineHandles, handle);
  return handle;
}

export function createFence() {
  let handle = new FenceHandle(this);
  pushHandle(this.fenceHandles, handle);
  return handle;
}

export function createFramebuffer(createInfo) {
  let handle = new FramebufferHandle(this, createInfo);
  pushHandle(this.framebufferHandles, handle);
  return handle;
}

export function createImageView(createInfo) {
  let handle = new ImageViewHandle(this, createInfo);
  pushHandle(this.imageViewHandles, handle);
  return handle;
}

export function createPipelineLayout(createInfo) {
  let handle = new PipelineLayoutHandle(this, createInfo);
  pushHandle(this.pipelineLayoutHandles, handle);
  return handle;
}

export function createRenderPass(createInfo) {
  let handle = new RenderPassHandle(this, createInfo);
  pushHandle(this.renderPassHandles, handle);
  return handle;
}

export function createRenderPipeline(createInfo) {
  let handle = new RenderPipelineHandle(this, createInfo);
  pushHandle(this.renderPipelineHandles, handle);
  return handle;
}

export function createSemaphore() {
  let handle = new SemaphoreHandle(this);
  pushHandle(this.semaphoreHandles, handle);
  return handle;
}

export function createShader(createInfo) {
  let handle = new ShaderHandle(this, createInfo);
  pushHandle(this.shaderHandles, handle);
  return handle;
}

export function createSwapchain(createInfo) {
  let handle = new SwapchainHandle(this, createInfo);
  pushHandle(this.swapchainHandles, handle);
  return handle;
}
