import nvk from "nvk"
import {InitializedArray} from "./utils.mjs"

Object.assign(global,nvk);

export default class Engine{
    constructor(){
        this.instance;
        this.device;
        this.window;
        this.surface;
        this.swapchain;
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
    let deviceExtensions = ["VK_KHR_swapchain"]
    let deviceCreateInfo = new VkDeviceCreateInfo();
    deviceCreateInfo.queueCreateInfoCount = 1;
    deviceCreateInfo.pQueueCreateInfos = [deviceQueueInfo];
    deviceCreateInfo.pEnabledFeatures = usedFeatures;
    deviceCreateInfo.enabledExtensionCount = deviceExtensions.length;
    deviceCreateInfo.ppEnabledExtensionNames = deviceExtensions;

    this.device = new VkDevice();
    if (vkCreateDevice(physDevices[0], deviceCreateInfo, null, this.device) !== VK_SUCCESS)
        console.error("vkCreateDevice failed");

    let queue = new VkQueue();
    vkGetDeviceQueue(this.device, 0, 0, queue);

    let surfaceSupport = {$:false};
    vkGetPhysicalDeviceSurfaceSupportKHR(physDevices[0],0,this.surface,surfaceSupport);
    console.log("surfaceSupport: "+surfaceSupport.$);

    let surfaceCapabilities = new VkSurfaceCapabilitiesKHR()
    vkGetPhysicalDeviceSurfaceCapabilitiesKHR(physDevices[0],this.surface,surfaceCapabilities);

    let surfaceFormatCount = {$:0};
    vkGetPhysicalDeviceSurfaceFormatsKHR(physDevices[0],this.surface,surfaceFormatCount,null);
    let surfaceFormats = new InitializedArray(VkSurfaceFormatKHR, surfaceFormatCount.$);
    vkGetPhysicalDeviceSurfaceFormatsKHR(physDevices[0],this.surface,surfaceFormatCount,surfaceFormats);
    console.log(surfaceFormats.length);
    for (let i = 0;i<surfaceFormats.length;i++)
        console.log(surfaceFormats[i].format);

    let swapchainCreateInfo = new VkSwapchainCreateInfoKHR();
    swapchainCreateInfo.surface = this.surface;
    swapchainCreateInfo.minImageCount = 2;
    swapchainCreateInfo.imageFormat = VK_FORMAT_B8G8R8A8_UNORM;
    swapchainCreateInfo.imageColorSpace = VK_COLOR_SPACE_SRGB_NONLINEAR_KHR;
    swapchainCreateInfo.imageExtent = new VkExtent2D({width:480,height:320});
    swapchainCreateInfo.imageArrayLayers = 1;
    swapchainCreateInfo.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
    swapchainCreateInfo.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
    swapchainCreateInfo.queueFamilyIndexCount = 0;
    swapchainCreateInfo.pQueueFamilyIndices = null;
    swapchainCreateInfo.preTransform = VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR;
    swapchainCreateInfo.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
    swapchainCreateInfo.presentMode = VK_PRESENT_MODE_FIFO_KHR;
    swapchainCreateInfo.clipped = true;
    swapchainCreateInfo.oldSwapchain = null;

    this.swapchain = new VkSwapchainKHR();
    vkCreateSwapchainKHR(this.device,swapchainCreateInfo,null,this.swapchain);
}
Engine.prototype.shutdownVulkan = function() {
    vkDeviceWaitIdle(this.device);

    vkDestroySwapchainKHR(this.device,this.swapchain,null);
    vkDestroyDevice(this.device, null);
    vkDestroySurfaceKHR(this.instance,this.surface,null);
    vkDestroyInstance(this.instance, null);
}