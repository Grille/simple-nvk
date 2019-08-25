import nvk from "nvk"
import { pushHandle, deleteHandle } from "./utils.mjs";
//export let pipelineHandle = null;

export let computePipelineHandles = [];

export function createComputePipeline(createInfo){
  let { shader, bindings = []} = createInfo;

  let descriptors = this.getVkBindingDescriptors(bindings, VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, VK_SHADER_STAGE_COMPUTE_BIT);

  let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
  pipelineLayoutInfo.setLayoutCount = 1;
  pipelineLayoutInfo.pSetLayouts = [descriptors.vkSetLayout];

  let pipelineLayout = new VkPipelineLayout();
  let result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
  this.assertVulkan(result);

  let computePipelineInfo = new VkComputePipelineCreateInfo();
  computePipelineInfo.stage.stage = VK_SHADER_STAGE_COMPUTE_BIT;
  computePipelineInfo.stage.module = shader.vkShader;
  computePipelineInfo.stage.pName = "main";
  computePipelineInfo.stage.pSpecializationInfo = null;
  computePipelineInfo.layout = pipelineLayout;

  let pipeline = new VkPipeline();
  result = vkCreateComputePipelines(this.device, null, 1, [computePipelineInfo], null, [pipeline]);
  this.assertVulkan(result);

  let handle = {
    vksStorageDescriptors:descriptors,
    vkLayout: pipelineLayout,
    vkPipeline: pipeline,
  };

  pushHandle(this.computePipelineHandles, handle);

  return handle;

}

export function destroyComputePipeline(handle) {
  if (handle.id === -1) return;
  vkDestroyDescriptorSetLayout(this.device, handle.vksStorageDescriptors.vkSetLayout, null);
  vkDestroyPipelineLayout(this.device, handle.vkLayout, null);
  vkDestroyPipeline(this.device, handle.vkPipeline, null);
  vkDestroyDescriptorPool(this.device, handle.vksStorageDescriptors.vkPool, null);
  deleteHandle(this.computePipelineHandles, handle);
}