import nvk from "nvk"

export class InitializedArray {
  constructor(ctor, count) {
    return [...Array(count)].map(() => new ctor());
  }
};

export function pushHandle(handles,handle) {
  let id = handles.length;
  for (let i = 0;i<handles.length;i++){
    if (handles[i]===null){
      id = i;
      break;
    }
  }
  handle.id = id;
  handles[id] = handle;
}
export function deleteHandle(handles,handle) {
  handles[handle.id] = null;
  handle.id = -1;
  /*handles.sort((a, b)=>{
    return b.id - a.id
  });*/
}

export function assertVulkan(result){
  if (result === nvk.VK_SUCCESS) return;
  if (result == null) throw new Error(`Vulkan assertion invalid!`);
  let vkResults = [
    "VK_NOT_READY",
    "VK_TIMEOUT",
    "VK_EVENT_SET",
    "VK_EVENT_RESET",
    "VK_INCOMPLETE",
    "VK_ERROR_OUT_OF_HOST_MEMORY",
    "VK_ERROR_OUT_OF_DEVICE_MEMORY",
    "VK_ERROR_INITIALIZATION_FAILED",
    "VK_ERROR_DEVICE_LOST",
    "VK_ERROR_MEMORY_MAP_FAILED",
    "VK_ERROR_LAYER_NOT_PRESENT",
    "VK_ERROR_EXTENSION_NOT_PRESENT",
    "VK_ERROR_FEATURE_NOT_PRESENT",
    "VK_ERROR_INCOMPATIBLE_DRIVER",
    "VK_ERROR_TOO_MANY_OBJECTS",
    "VK_ERROR_FORMAT_NOT_SUPPORTED",
    "VK_ERROR_FRAGMENTED_POOL",
    "VK_ERROR_SURFACE_LOST_KHR",
    "VK_ERROR_NATIVE_WINDOW_IN_USE_KHR",
    "VK_SUBOPTIMAL_KHR",
    "VK_ERROR_OUT_OF_DATE_KHR",
    "VK_ERROR_INCOMPATIBLE_DISPLAY_KHR",
    "VK_ERROR_VALIDATION_FAILED_EXT",
    "VK_ERROR_INVALID_SHADER_NV",
    "VK_ERROR_OUT_OF_POOL_MEMORY_KHR",
    "VK_ERROR_OUT_OF_POOL_MEMORY",
    "VK_ERROR_INVALID_EXTERNAL_HANDLE_KHR",
    "VK_ERROR_INVALID_EXTERNAL_HANDLE",
    "VK_ERROR_INVALID_DRM_FORMAT_MODIFIER_PLANE_LAYOUT_EXT",
    "VK_ERROR_FRAGMENTATION_EXT",
    "VK_ERROR_NOT_PERMITTED_EXT",
    "VK_ERROR_INVALID_DEVICE_ADDRESS_EXT",
    "VK_ERROR_FULL_SCREEN_EXCLUSIVE_MODE_LOST_EXT"
  ]
  let message = "UNKNOWN_ERROR"
  for (let i = 0;i< vkResults.length;i++){
    if (nvk[vkResults[i]] === result) {
      message = vkResults[i];
      break;
    }
  }
  throw new Error(`Vulkan assertion failed! [${message}]`);
}