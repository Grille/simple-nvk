import * as assert from "./vulkan-assert.mjs";
import * as basic from "./vulkan-basic.mjs";
import * as buffer from "./handles/buffer.mjs";
import * as command from "./handles/command.mjs";
import * as computePipeline from "./handles/compute-pipeline.mjs";
import * as destroy from "./vulkan-destroy.mjs";
import * as enums from "./vulkan-enum.mjs";
import * as framebuffer from "./handles/framebuffer.mjs";
import * as image from "./handles/image-view.mjs";
import * as pipeline from "./vulkan-pipeline.mjs";
import * as renderPass from "./handles/render-pass.mjs";
import * as renderPipeline from "./handles/render-pipeline.mjs";
import * as setup from "./vulkan-setup.mjs";
import * as shader from "./handles/shader.mjs";
import * as swapchain from "./handles/swapchain.mjs";
import * as fence from "./handles/fence.mjs";
import * as semaphore from "./handles/semaphore.mjs";

import nvk from "nvk"
Object.assign(global, nvk);

class Vulkan {
  constructor(){}
}

Object.assign(Vulkan.prototype, assert);
Object.assign(Vulkan.prototype, basic);
Object.assign(Vulkan.prototype, buffer);
Object.assign(Vulkan.prototype, command);
Object.assign(Vulkan.prototype, computePipeline);
Object.assign(Vulkan.prototype, destroy);
Object.assign(Vulkan.prototype, enums);
Object.assign(Vulkan.prototype, framebuffer);
Object.assign(Vulkan.prototype, image);
Object.assign(Vulkan.prototype, pipeline);
Object.assign(Vulkan.prototype, renderPass);
Object.assign(Vulkan.prototype, renderPipeline);
Object.assign(Vulkan.prototype, fence);
Object.assign(Vulkan.prototype, semaphore);
Object.assign(Vulkan.prototype, setup);
Object.assign(Vulkan.prototype, shader);
Object.assign(Vulkan.prototype, swapchain);

export default Vulkan;


