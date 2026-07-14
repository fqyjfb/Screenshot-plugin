<div align="center">
  <h1>截图插件 - ToolBox</h1>
  <p><em>ToolBox 的原生多显示器截图捕获、标注和裁剪工具。</em></p>
  
  [![ToolBox 生态](https://img.shields.io/badge/ToolBox-生态-3b82f6?style=for-the-badge&logo=electron&logoColor=white)](https://github.com/fqyjfb/toolbox)
  [![许可证](https://img.shields.io/badge/许可证-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

ToolBox 是一个多功能平台，旨在托管丰富的插件生态系统，将强大的工具无缝集成到您的日常工作中。作为该生态系统的核心扩展，**截图插件**将 ToolBox 转变为一个功能强大且原生的视觉捕获和标注实用程序。

## 什么是截图插件？

截图插件是 ToolBox 的一个内置无缝覆盖工具，可将原生多显示器截图捕获功能直接带给您。与依赖外部截图工具或通用系统快捷键不同，截图插件会在您的所有活动显示器上立即启动覆盖层。它允许您选择、裁剪并用文本、箭头、矩形和自由手绘对屏幕截图进行标注，然后将其保存到剪贴板或本地系统。

## 主要功能

- **多显示器支持：** 自动捕获所有活动显示器并完美缩放，让您在整个工作空间中无缝截图。
- **丰富的标注工具：** 
  - **画笔：** 自由绘制以快速突出显示或圈出项目。
  - **矩形和箭头：** 绘制结构化的几何形状和箭头以指出重要元素。
  - **文本：** 直接在截图上添加自定义文本标注，支持动态大小和颜色选项。
- **动态工具自定义：** 随时调整活动绘制工具的大小（3 级）和颜色。
- **智能裁剪：** 可拖动和调整大小的选择框，完美框选您需要捕获的内容。
- **深度 ToolBox 集成：**
  - 从 ToolBox 侧边栏即时触发，零延迟。
  - 利用原生 Electron API 实现快速安全的屏幕缓冲区访问。

## 配置与使用

1. **安装：** 从 ToolBox 插件商店安装 `截图工具` 插件。
2. **捕获：** 点击 ToolBox 侧边栏中的截图图标，冻结屏幕并进入捕获覆盖层。
3. **选择区域：** 在屏幕上单击并拖动，围绕要捕获的区域创建选择框。
4. **标注：** 使用浮动工具栏选择所需的工具（画笔、箭头、矩形、文本）并对所选区域进行标注。根据需要自定义颜色和笔画大小。
5. **保存/复制：** 完成捕获后将标注图像直接复制到系统剪贴板或保存到本地。

---

## 插件开发

本插件遵循 ToolBox 插件开发规范。更多详情请参阅：
- [PLUGIN_DEVELOPMENT_SPEC.md](https://github.com/fqyjfb/toolbox/blob/main/docs/PLUGIN_DEVELOPMENT_SPEC.md)
- [PLUGIN_DEVELOPMENT_GUIDE.md](https://github.com/fqyjfb/toolbox/blob/main/docs/PLUGIN_DEVELOPMENT_GUIDE.md)

---

## 许可证

MIT
