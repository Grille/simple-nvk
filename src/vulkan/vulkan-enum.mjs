import nvk from "nvk"

export const INT = 0;
export const UINT = 1;
export const FLOAT = 2;

export const TYPE_INT8 = INT | 1 << 4;
export const TYPE_UINT8 = UINT | 1 << 4;
export const TYPE_INT16 = INT | 2 << 4;
export const TYPE_UINT16 = UINT | 2 << 4;
export const TYPE_INT32 = INT | 4 << 4;
export const TYPE_UINT32 = UINT | 4 << 4;
export const TYPE_INT64 = INT | 8 << 4;
export const TYPE_UINT64 = UINT | 8 << 4;
export const TYPE_FLOAT32 = FLOAT | 4 << 4;
export const TYPE_FLOAT64 = FLOAT | 8 << 4;

export const COMMAND_LEVEL_PRIMARY = nvk.VK_COMMAND_BUFFER_LEVEL_PRIMARY;
export const COMMAND_LEVEL_SECONDARY = nvk.VK_COMMAND_BUFFER_LEVEL_SECONDARY;

export const COMMAND_USAGE_ONE_TIME = nvk.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
export const COMMAND_USAGE_SIMULTANEOUS = nvk.VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;

export const BUFFER_LOCATION_NONE = -1;

export const BUFFER_USAGE_VERTEX = 0;
export const BUFFER_USAGE_INDEX = 1;
export const BUFFER_USAGE_STORAGE = 2;
export const BUFFER_USAGE_UNIFORM = 3;

export const SHADER_STAGE_NONE = -1;
export const SHADER_STAGE_VERTEX = 0;
export const SHADER_STAGE_FRAGMENT = 1;
export const SHADER_STAGE_COMPUTE = 2;

export const SHADER_SRC_GLSL = 0;
export const SHADER_SRC_SPIRV = 1;