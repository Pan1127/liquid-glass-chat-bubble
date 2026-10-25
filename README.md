# Liquid Glass Chat Bubble — Desk Shader

把雨夜书桌中的液态玻璃光学代码直接用于聊天气泡。它不是一层灰色毛玻璃：气泡会对背后的壁纸产生边缘折射、轻微放大、色散、柔化和方向性高光。

## 特性

- 使用书桌版同一段 GLSL 光学公式
- 两种聊天角色共用同一玻璃材质
- 文字、链接和按钮仍在原 DOM 中，不会变成截图
- 自动读取 `data-glass-host` 的 `background-image`、`background-color`、`cover` 与 `center`
- 只为屏幕内的气泡保留画布；长消息只分配可见切片
- 页面隐藏、气泡离屏或切换样式后立即释放切片
- WebGL2 或壁纸不可用时自动保留 CSS 后备样式
- 根据壁纸明暗自动选择黑/白文字；自定义文字色可在接入层覆盖

## 直接运行

用静态服务器打开本仓库即可。不要直接双击 `index.html`；浏览器的本地文件限制可能阻止 WebGL 读取壁纸。

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## 接入已有聊天页

消息结构映射为：

```html
<body data-glass-host>
  <main id="messages">
    <div class="message-row them"><div class="bubble">消息</div></div>
    <div class="message-row me"><div class="bubble">消息</div></div>
  </main>
  <script src="glass-bubbles.js"></script>
</body>
```

引入 `glass-bubbles.css` 和 `glass-bubbles.js`。如果聊天容器外还有页面结构，把 `data-glass-host` 放到真正承载壁纸的元素上。壁纸需要用 `background-image: url(...)`，并建议 `background-size: cover; background-position: center`。

现有项目的类名不同，可以修改 `glass-bubbles.js` 顶部的 `messages`、`app` 和 `selector`。请保留 IntersectionObserver、可见切片和页面隐藏释放逻辑，避免长聊天持续占用移动端 GPU 内存。

如果页面已经使用 `document.documentElement.dataset.bubbleStyle`，脚本只在它为空或等于 `glass` 时绘制。

## 光学参数

这版刻意不把书桌玻璃改成另一种预设。核心值保持：

- 边缘厚度：`min(20px, 32% × 半边尺寸)`
- 边缘位移上限：`18px`
- 透镜收缩：`1.8%`
- 波纹：`0.9px`
- 边缘色散：`1.2%–4.7%`
- 中心柔化：四分之一尺寸 mipmap，LOD `0.8`
- 光方向：`(-0.55, 0.83)`
- 夜间系数：`1`

`desk-fragment.glsl` 是从书桌模块提取的可审阅片段；`original-liquid-glass.js` 保留当时完整原文件以便逐行核对。`glass-bubbles.js` 仅将输入从 Three.js 帧缓冲改为当前聊天壁纸，并把玻璃矩形改为可见聊天气泡。

## 浏览器限制

实际折射需要 WebGL2。Safari/iPhone 的最终外观与功耗请在真机测试；仓库中的自动检查只验证源码一致性和资源释放逻辑，不等同于 GPU 像素测试。玻璃只能折射脚本可读取的壁纸图片；跨域且没有 CORS 的图片会触发后备样式。

## 来源与许可证

光学着色器改编自 [TangfanOVO/qiaosi](https://github.com/TangfanOVO/qiaosi) 的 `scenes/windowsill/src/js/17-tags-camera-glass.js`，原项目采用 **AGPL-3.0-only**。

本仓库因此整体采用 **GNU AGPL v3**。网络部署修改版时，也需要向使用者提供对应源代码。旧版 Hyalite 演示实现已移除，避免两套折射器同时运行。
