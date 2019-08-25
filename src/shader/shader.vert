#version 450
#extension GL_ARB_separate_shader_objects : enable

out gl_PerVertex {
  vec4 gl_Position;
};

layout(location = 0) in vec2 pos;
layout(location = 1) in vec4 color;

layout(binding = 0) uniform UBO {
  mat4 mvp;
} ubo;

layout(location = 0) out vec4 vertexColor;

void main(){
  gl_Position = vec4(pos, 0.0, 1.0);
  vertexColor = color;
}