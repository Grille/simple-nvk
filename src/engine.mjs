import nvk from "nvk"
import {InitializedArray} from "./utils.mjs"

Object.assign(global,nvk);

export default class Engine{
    constructor(){
        this.instance;
        this.device;
        this.window;
        this.surface;
    }
}

Engine.prototype.startVulkan = function() {
    this.instance = new VkInstance();
    this.window = new VulkanWindow({ width: 480, height: 320, title: "NVK Mandelbrot" });
    this.surface = new VkSurfaceKHR();

    let validationLayers = ["VK_LAYER_LUNARG_standard_validation"]
    let extensions = [...this.window.getRequiredInstanceExtensions()];

    /*
    for (let key in this.window) {
        console.log(key);
    };*/

    let appInfo = new VkApplicationInfo();
    appInfo.pApplicationName = "NVK Mandelbrot"
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


    if (vkCreateInstance(instanceInfo, null, this.instance) !== VK_SUCCESS)
        console.error("vkCreateInstance failed");
    //vkGetInstanceProcAddr(instance,"vkk_surface");

    if (this.window.createSurface(this.instance,null,this.surface)!==0)
        console.error("createSurface failed");

    let physDevicesCount = { $: 0 };
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, null);
    let physDevices = new InitializedArray(VkPhysicalDevice, physDevicesCount.$);
    vkEnumeratePhysicalDevices(this.instance, physDevicesCount, physDevices);

    let properties = new VkPhysicalDeviceProperties();
    vkGetPhysicalDeviceProperties(physDevices[0], properties)
    console.log(properties.deviceName);
    let ver = properties.apiVersion
    console.log(VK_VERSION_MAJOR(ver) + "." + VK_VERSION_MINOR(ver) + "." + VK_VERSION_PATCH(ver));

    let queueFamilysCount = { $: 0 }
    vkGetPhysicalDeviceQueueFamilyProperties(physDevices[0], queueFamilysCount, null);
    let queueFamilys = new InitializedArray(VkQueueFamilyProperties, queueFamilysCount.$)
    vkGetPhysicalDeviceQueueFamilyProperties(physDevices[0], queueFamilysCount, queueFamilys);

    for (let i = 0; i < queueFamilysCount.$; i++) {
        let queue = queueFamilys[i];
        console.log("queue <" + i + ">");
        console.log("count       : " + queue.queueCount);
        console.log("graphic  bit: " + ((queue.queueFlags & VK_QUEUE_GRAPHICS_BIT) ? "true" : "false"));
        console.log("compute  bit: " + ((queue.queueFlags & VK_QUEUE_COMPUTE_BIT) ? "true" : "false"));
        console.log("transfer bit: " + ((queue.queueFlags & VK_QUEUE_TRANSFER_BIT) ? "true" : "false"));
    }

    let deviceQueueInfo = new VkDeviceQueueCreateInfo();
    deviceQueueInfo.queueFamilyIndex = 0;
    deviceQueueInfo.queueCount = 1;
    deviceQueueInfo.pQueuePriorities = new Float32Array([1, 1, 1, 1]);

    let usedFeatures = new VkPhysicalDeviceFeatures({

    });

    let deviceCreateInfo = new VkDeviceCreateInfo();
    deviceCreateInfo.queueCreateInfoCount = 1;
    deviceCreateInfo.pQueueCreateInfos = [deviceQueueInfo];
    deviceCreateInfo.pEnabledFeatures = usedFeatures;

    this.device = new VkDevice();
    if (vkCreateDevice(physDevices[0], deviceCreateInfo, null, this.device) !== VK_SUCCESS)
        console.error("vkCreateDevice failed");

    let queue = new VkQueue();
    vkGetDeviceQueue(this.device, 0, 0, queue);
}
Engine.prototype.shutdownVulkan = function() {
    vkDeviceWaitIdle(this.device);
    vkDestroyDevice(this.device, null);
    vkDestroySurfaceKHR(this.instance,this.surface,null);
    vkDestroyInstance(this.instance, null);
}