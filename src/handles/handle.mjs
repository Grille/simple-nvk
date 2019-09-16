export default class Handle{
  constructor(snvk){
    this.id=-1;
    this.snvk = snvk;
    this.device = snvk.device;
    this.physicalDevice = snvk.physicalDevice;
    this.handleList = null;
  }
  destroy(){
    throw new Error("destroy not implemented");
  }
}