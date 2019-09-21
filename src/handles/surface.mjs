import { assertVulkan, InitializedArray } from "../utils.mjs"
import Handle from "./handle.mjs";

export default class SurfaceHandle extends Handle {
  constructor(snvk){
    super(snvk);
    let { physicalDevice } = snvk;

    let surface = new VkSurfaceKHR();
    if (snvk.window.createSurface(snvk.instance, null, surface) !== 0)
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
    vkDestroySurfaceKHR(this.snvk.instance, this.vkSurface, null);
  }
}