import SNVK from "./snvk.mjs";
import nvk from "nvk";

Object.assign(global, nvk);
global.__snvk = new SNVK();
export default global.__snvk;