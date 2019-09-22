export default class Handle{
  constructor(owner){
    this.id=-1;
    this.device = owner.device;
    this.physicalDevice = owner.physicalDevice;
    this.handles = [];
    this.owner = owner;
  }
  pushHandle(handle){
    let id = this.handles.length;
    for (let i = 0; i < this.handles.length; i++) {
      if (this.handles[i] === null) {
        id = i;
        break;
      }
    }
    handle.id = id;
    handle.owner = this;
    this.handles[id] = handle;
  }
  super_destroy(){
    vkDeviceWaitIdle(this.device);
    for (let i = this.handles.length - 1; i >= 0; i--) {
      let handle = this.handles[i];
      if (handle !== null && handle.id !== -1) {
        handle.destroy();
      }
    }
    this.handles.length = 0;
    if (this.owner !== null) {
      this.owner.handles[this.id] = null;
    }
    this.id = -1;
  }
  destroy(){
    throw new Error("destroy not implemented");
  }
}