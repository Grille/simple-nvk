export const INT = 0;
export const UINT = 1;
export const FLOAT = 2;

export const TYPE_INT8 = { type: INT, size: 1 }
export const TYPE_UINT8 = { type: UINT, size: 1 }
export const TYPE_INT16 = { type: INT, size: 2 }
export const TYPE_UINT16 = { type: UINT, size: 2 }
export const TYPE_INT32 = { type: INT, size: 4 }
export const TYPE_UINT32 = { type: UINT, size: 4 }
export const TYPE_INT64 = { type: INT, size: 8 }
export const TYPE_UINT64 = { type: UINT, size: 8 }
export const TYPE_FLOAT32 = { type: FLOAT, size: 4 }
export const TYPE_FLOAT64 = { type: FLOAT, size: 8 }

export const BUFFER_LOCATION_NONE = -1;

export const BUFFER_USAGE_VERTEX = 0;
export const BUFFER_USAGE_INDEX = 1;
export const BUFFER_USAGE_COMPUTE = 2;

export const SHADER_STAGE_NONE = -1;
export const SHADER_STAGE_VERTEX = 0;
export const SHADER_STAGE_FRAGMENT = 1;
export const SHADER_STAGE_COMPUTE = 2;