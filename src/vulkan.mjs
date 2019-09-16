import * as basic from "./vulkan-basic.mjs";
import * as destroy from "./vulkan-destroy.mjs";
import * as enums from "./vulkan-enum.mjs";
import * as setup from "./vulkan-setup.mjs";
import * as handles from "./vulkan-handles.mjs";

import nvk from "nvk"
Object.assign(global, nvk);

class Vulkan {
  constructor(){}
}

Object.assign(Vulkan.prototype, basic);
Object.assign(Vulkan.prototype, destroy);
Object.assign(Vulkan.prototype, enums);
Object.assign(Vulkan.prototype, setup);
Object.assign(Vulkan.prototype, handles);

export default Vulkan;


