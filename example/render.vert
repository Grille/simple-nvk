#version 450
#extension GL_ARB_separate_shader_objects : enable

out gl_PerVertex {
  vec4 gl_Position;
};

layout(location = 0) in vec3 pos;
layout(location = 1) in vec4 color;

layout(binding = 0) uniform ub {
  mat4 model;
  mat4 view;
  mat4 projection;
};

layout(location = 0) out vec4 vertexColor;

void main(){
  vec4 vertexPosition = projection * view * model * vec4(pos, 1.0);

  vertexColor = color;
  gl_Position = vertexPosition;
}