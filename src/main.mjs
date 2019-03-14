import nvk from "nvk"
import {InitializedArray} from "./utils.mjs"

Object.assign(global,nvk);

let appInfo = new VkApplicationInfo();
appInfo.pApplicationName = "NVK Mandelbrot"
appInfo.applicationVersion = VK_MAKE_VERSION(1,0,0);
appInfo.pEngineName = "engine";
appInfo.engineVersion = VK_MAKE_VERSION(1,0,0);;
appInfo.apiVersion = VK_MAKE_VERSION(1,0,0);

let layersCount = {$:0};
vkEnumerateInstanceLayerProperties(layersCount,null)
let layers = new InitializedArray(VkLayerProperties,layersCount.$)
vkEnumerateInstanceLayerProperties(layersCount,layers)
for (let i = 0;i<layersCount.$;i++){
    console.log("layer <"+i+">");
    console.log("name       : "+ layers[i].layerName);
}

let validationLayers = ["VK_LAYER_LUNARG_standard_validation"]

let instanceInfo = new VkInstanceCreateInfo();
instanceInfo.pApplicationinfo = appInfo;
//instanceInfo.enabledLayerCount = 0;
instanceInfo.enabledExtensionCount = 0;
instanceInfo.enabledLayerCount = validationLayers.length;
instanceInfo.ppEnabledLayersNames = validationLayers;

let instance = new VkInstance();
console.log("god");
if(vkCreateInstance(instanceInfo,null,instance)!==VK_SUCCESS)
    console.error("vkCreateInstance failed");
console.log("why???");

let physDevicesCount = {$:0};
vkEnumeratePhysicalDevices(instance,physDevicesCount,null);
let physDevices = new InitializedArray(VkPhysicalDevice,physDevicesCount.$);
vkEnumeratePhysicalDevices(instance,physDevicesCount,physDevices);

let properties = new VkPhysicalDeviceProperties();
vkGetPhysicalDeviceProperties(physDevices[0],properties)
console.log(properties.deviceName);
let ver = properties.apiVersion
console.log(VK_VERSION_MAJOR(ver)+"."+VK_VERSION_MINOR(ver)+"."+VK_VERSION_PATCH(ver));

let queueFamilysCount = {$:0}
vkGetPhysicalDeviceQueueFamilyProperties(physDevices[0],queueFamilysCount,null);
let queueFamilys = new InitializedArray(VkQueueFamilyProperties,queueFamilysCount.$)
vkGetPhysicalDeviceQueueFamilyProperties(physDevices[0],queueFamilysCount,queueFamilys);

for (let i = 0;i<queueFamilysCount.$;i++){
  let queue = queueFamilys[i];
  console.log("queue <"+i+">");
  console.log("count       : "+ queue.queueCount);
  console.log("graphic  bit: "+((queue.queueFlags & VK_QUEUE_GRAPHICS_BIT)?"true":"false"));
  console.log("compute  bit: "+((queue.queueFlags & VK_QUEUE_COMPUTE_BIT)?"true":"false"));
  console.log("transfer bit: "+((queue.queueFlags & VK_QUEUE_TRANSFER_BIT)?"true":"false"));
}

let deviceQueueInfo = new VkDeviceQueueCreateInfo();
deviceQueueInfo.queueFamilyIndex = 0;
deviceQueueInfo.queueCount = 4;

let usedFeatures = new VkPhysicalDeviceFeatures({

});

let deviceCreateInfo = new VkDeviceCreateInfo();
deviceCreateInfo.queueCreateInfoCount = 1;
deviceCreateInfo.pQueueCreateInfos = [deviceQueueInfo];
deviceCreateInfo.pEnabledFeatures = usedFeatures;

let device = new VkDevice();
if(vkCreateDevice(physDevices[0],deviceCreateInfo,null,device)!==VK_SUCCESS)
    console.error("vkCreateDevice failed");
//console.log(nvk);