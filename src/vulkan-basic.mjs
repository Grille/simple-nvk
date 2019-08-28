import nvk from "nvk"
import { pushHandle, deleteHandle, InitializedArray } from "./utils.mjs"

export let instance = null;
export let physicalDevice = null;
export let device = null;
export let window = null;
export let surface = null;
export let swapchain = null;
export let swapImageViews = [];
export let pipelineLayout = null;
export let renderPass = null;
export let pipeline = null;
export let framebuffers = [];
export let commandPool = null;
export let commandBuffers = [];
export let queue = null;

export let shaderSrcCache = {};
export let vulkanReady = false;
export let pipelineInputChanged = false;

export let queueFamily = 0;

export function startWindow(obj) {
  this.window = new VulkanWindow(obj);
}
export function closeWindow(){
  this.window.close();
};

export function startVulkan() {

  let result = 0;

  this.createInstance();

  this.physicalDevice = this.getPhysicalDevice();
  this.queueFamily = this.getQueueFamilyIndex(this.physicalDevice);

  this.device = this.getLogicalDevice(this.physicalDevice, this.queueFamily);
  this.queue = this.getQueue(this.queueFamily);

  let commandPoolCreateInfo = new VkCommandPoolCreateInfo();
  commandPoolCreateInfo.queueFamilyIndex = this.queueFamily;

  this.commandPool = new VkCommandPool();
  result = vkCreateCommandPool(this.device, commandPoolCreateInfo, null, this.commandPool);
  this.assertVulkan(result);
}
