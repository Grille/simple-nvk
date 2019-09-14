export default class Handle{
  constructor(snvk){
    this.id=-1;
    this.snvk = snvk;
    this.device = snvk.device;
    this.physicalDevice = snvk.physicalDevice;
  }
  destroy(){
    throw new Error("handle has no deconstructor");
  }
}