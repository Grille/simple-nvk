import * as assert from "./vulkan-assert.mjs";
import * as basic from "./vulkan-basic.mjs";
import * as buffer from "./vulkan-buffer.mjs";
import * as command from "./vulkan-command.mjs";
import * as destroy from "./vulkan-destroy.mjs";
import * as pipeline from "./vulkan-pipeline.mjs";
import * as setup from "./vulkan-setup.mjs";
import * as shader from "./vulkan-shader.mjs";
import * as swapchain from "./vulkan-swapchain.mjs";

class Vulkan {
  constructor(){}
}

Object.assign(Vulkan.prototype, assert);
Object.assign(Vulkan.prototype, basic);
Object.assign(Vulkan.prototype, buffer);
Object.assign(Vulkan.prototype, command);
Object.assign(Vulkan.prototype, destroy);
Object.assign(Vulkan.prototype, pipeline);
Object.assign(Vulkan.prototype, setup);
Object.assign(Vulkan.prototype, shader);
Object.assign(Vulkan.prototype, swapchain);

export default Vulkan;


