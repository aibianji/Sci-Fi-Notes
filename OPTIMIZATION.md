# Nexus Notes 安装包体积优化指南

为了确保最终安装包体积小于10MB，请遵循以下优化策略：

## 1. 前端资源优化

### JavaScript 优化
- 使用 Vite 的生产构建模式，启用代码分割和树摇
- 移除所有控制台日志和调试代码
- 使用 terser 进行代码压缩和混淆

### CSS 优化
- 使用 PurgeCSS 移除未使用的 Tailwind 类
- 压缩 CSS 文件
- 避免使用大型 CSS 框架

### 资源优化
- 使用 SVG 图标而非 PNG/JPG
- 压缩所有图像资源
- 使用 WebP 格式替代 JPG/PNG
- 移除未使用的字体和图标

## 2. Tauri 优化

### 配置优化
- 在 `tauri.conf.json` 中设置 `withGlobalTauri: false`
- 仅启用必要的 API 权限
- 使用 `allowlist` 限制可用 API

### 构建优化
- 使用 `--target x86_64-pc-windows-msvc` 指定目标平台
- 启用 LTO (Link Time Optimization)
- 使用 `opt-level = 's'` 优化 Rust 代码大小

### 依赖优化
- 移除不必要的 Rust 依赖
- 使用 `default-features = false` 并仅启用必要功能
- 避免使用大型 Rust 库

## 3. 构建脚本

使用以下命令进行优化构建：

```bash
# 优化前端构建
node scripts/optimize-build.js

# 优化 Tauri 构建
npm run tauri build -- --target x86_64-pc-windows-msvc

