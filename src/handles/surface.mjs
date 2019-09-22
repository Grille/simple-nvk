import { assertVulkan, InitializedArray } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class SurfaceHandle extends Handle {
  constructor(owner){
    super(owner);
    let { physicalDevice } = owner;

    let surface = new VkSurfaceKHR();
    if (owner.window.createSurface(owner.instance, null, surface) !== 0)
      console.error("createSurface failed");
  
    let surfaceSupport = { $: false };
    vkGetPhysicalDeviceSurfaceSupportKHR(physicalDevice, 0, surface, surfaceSupport);

    let surfaceCapabilities = new VkSurfaceCapabilitiesKHR()
    vkGetPhysicalDeviceSurfaceCapabilitiesKHR(physicalDevice, surface, surfaceCapabilities);
  
    let surfaceFormatCount = { $: 0 };
    vkGetPhysicalDeviceSurfaceFormatsKHR(physicalDevice, surface, surfaceFormatCount, null);
    let surfaceFormats = new InitializedArray(VkSurfaceFormatKHR, surfaceFormatCount.$);
    vkGetPhysicalDeviceSurfaceFormatsKHR(physicalDevice, surface, surfaceFormatCount, surfaceFormats);

    this.vkSurface = surface;
  }
  destroy(){
    this.super_destroy();
    vkDestroySurfaceKHR(this.owner.instance, this.vkSurface, null);
  }
}