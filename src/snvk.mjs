import nvk from "nvk";
import { pushHandle, deleteHandle, InitializedArray, assertVulkan } from "./utils.mjs"

import * as enums from "./snvk-enum.mjs";
import DeviceHandle from "./device.mjs";

export default class SNVK {
  constructor() {
    Object.assign(this, enums);
    this.instance = null;
    this.handles = [];
  }

  startWindow(obj) {
    this.window = new VulkanWindow(obj);
  }
  closeWindow() {
    this.window.close();
  };

  startVulkan() {
    this.createInstance();
  }

  shutdown() {
    this.dh.destroy();
    vkDestroyInstance(this.instance, null);
  }

  createDevice(createInfo) {
    return this.dh = new DeviceHandle(this, createInfo);
  }

  createInstance() {
    let validationLayers = ["VK_LAYER_LUNARG_standard_validation", "VK_LAYER_LUNARG_parameter_validation"];
    let win = new VulkanWindow({width:1,height:1,title:"lol"});
    let extensions = [...win.getRequiredInstanceExtensions()];
    win.close();
  
    let appInfo = new VkApplicationInfo();
    appInfo.pApplicationName = "NVK Mandelbrot";
    appInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.pEngineName = "engine";
    appInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.apiVersion = VK_API_VERSION_1_0;
  
    let instanceInfo = new VkInstanceCreateInfo();
    instanceInfo.pApplicationinfo = appInfo;
    instanceInfo.enabledLayerCount = validationLayers.length;
    instanceInfo.ppEnabledLayerNames = validationLayers;
    instanceInfo.enabledExtensionCount = extensions.length;
    instanceInfo.ppEnabledExtensionNames = extensions;
  
    this.instance = new VkInstance();
    let result = vkCreateInstance(instanceInfo, null, this.instance)
    assertVulkan(result);
  }
  
}