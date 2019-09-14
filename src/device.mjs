export default class DeviceHandle{
  constructor(snvk){
    this.id=-1;
    this.snvk = snvk;
    this.device = snvk.device;
    this.physicalDevice = snvk.physicalDevice;
    this.handles = [];
  }
  destroy(){
    throw new Error("destroy not implemented");
  }
}