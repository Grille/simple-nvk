import Vulkan from "./vulkan/vulkan.mjs";
import fs from "fs";
import pngjs from "pngjs"; const { PNG } = pngjs;

import {main as mCompute} from "./compute.mjs";
import {main as mRender} from "./render.mjs";

console.log("\n--- < compute > ---")
mCompute();

console.log("\n--- < render > ---")
mRender();