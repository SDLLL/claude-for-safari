<h1 align="center">Claude for Safari</h1>

<p align="center">
  <strong>给你的 AI Agent 装上 Safari 浏览器操控能力</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://www.apple.com/macos/"><img src="https://img.shields.io/badge/macOS-only-black.svg?style=for-the-badge&logo=apple" alt="macOS"></a>
  <a href="https://github.com/SDLLL/claude-for-safari/stargazers"><img src="https://img.shields.io/github/stars/SDLLL/claude-for-safari?style=for-the-badge" alt="GitHub Stars"></a>
</p>

<p align="center">
  <a href="#快速上手">快速开始</a> · <a href="#它能做什么">功能</a> · <a href="#常见问题">FAQ</a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

---

## 为什么需要这个？

你想让 AI Agent 帮你操作浏览器——然后发现：

- 🔒 **Playwright** → 独立浏览器实例，抢占用户使用
- 🧩 **Claude for Chrome** → 需要安装 Chrome 扩展不适配 Safari
- 📝 **手动复制粘贴** → 每次都要自己把网页内容喂给 AI，效率极低

**你只是想让 AI 直接用你的 Safari，就像你自己操作一样。**

**Claude for Safari 把这一切变成一句话：**

```
npx skills add SDLLL/claude-for-safari
```

安装后对 Claude 说「帮我看看 Safari 里打开了什么」，它就能直接读取、操控你的真实浏览器。

---

## 快速上手

复制这行命令，在终端运行：

```bash
npx skills add SDLLL/claude-for-safari
```

然后启动 [Claude Code](https://claude.ai/download)：

```bash
claude
```

对它说「帮我看看 Safari 当前打开了哪些网页」。Agent 会自动引导完成权限配置。

> 兼容任何支持 Skills 的 AI Agent：Claude Code、Cursor、Windsurf 等。

### 前置配置（仅首次）

Agent 会自动检测并引导你完成，但你也可以提前配置：

1. **系统设置 > 隐私与安全性 > 自动化** → 允许终端控制 Safari
2. **Safari > 设置 > 高级** → 开启「显示网页开发者功能」
3. **Safari > 开发菜单** → 勾选「允许 Apple 事件的 JavaScript」
4. **（可选）系统设置 > 隐私与安全性 > 屏幕录制** → 允许终端录屏（启用后台截图）

---

## 它能做什么

零安装，纯 macOS 原生能力，一个 Skill 覆盖所有浏览器操作：

| 能力 | Agent 做的事 | 实现方式 |
|------|------------|---------|
| **查看标签页** | 列出所有窗口和标签的标题、URL | AppleScript |
| **读取页面** | 提取页面文本、结构化数据、简化 DOM | AppleScript + JavaScript |
| **执行 JS** | 在页面上下文中运行任意 JavaScript | AppleScript `do JavaScript` |
| **截图** | 截取 Safari 窗口画面，AI 可以"看到"页面 | `screencapture` |
| **导航** | 打开 URL、新建标签页、新建窗口 | AppleScript |
| **点击** | 点击页面元素（兼容 React/Vue/Angular） | JavaScript `dispatchEvent` |
| **输入** | 填写表单、模拟键盘输入 | JavaScript + System Events |
| **滚动** | 上下滚动、滚动到指定元素 | JavaScript `scrollBy/scrollTo` |
| **切换标签** | 按序号或 URL 关键词切换标签页 | AppleScript |
| **等待加载** | 等待页面加载完成后再操作 | JavaScript `readyState` |

### 截图模式

| 模式 | 需要权限 | 是否切换窗口 | 适用场景 |
|------|---------|------------|---------|
| **后台截图** | 屏幕录制权限 | 不切换 | 推荐，无感截图 |
| **前台截图** | 无需额外权限 | 短暂切换 (~0.3s) | 默认，自动切回 |

---

## 工作原理

```
Claude Code ──osascript──► Safari（读取/操控你的真实浏览器）
     │
     └──screencapture──► 截图 ──► Claude 看到页面内容
```

没有扩展，没有代理服务器，没有额外进程。

所有操作都通过 macOS 原生的 AppleScript 和 screencapture 完成，Safari 看到的就是真实用户操作。

---

## 常见问题

<details>
<summary><strong>需要提前安装什么吗？</strong></summary>

不需要安装任何软件。本 Skill 完全依赖 macOS 内置的 AppleScript 和 screencapture，开箱即用。只需在首次使用时授予几个系统权限。
</details>

<details>
<summary><strong>支持 Chrome / Firefox / Arc 吗？</strong></summary>

目前仅支持 Safari。其他浏览器推荐使用 <a href="https://github.com/nicepkg/playwright-mcp">Playwright MCP</a> 或 <a href="https://github.com/Areo-Joe/chrome-acp">Chrome ACP</a>。Safari 是 macOS 上唯一完整支持 AppleScript 自动化的浏览器。
</details>

<details>
<summary><strong>安全吗？AI 会不会乱操作？</strong></summary>

Claude Code 的权限系统会在每次敏感操作前征求你的确认。你可以选择逐条审批或批量授权。所有操作都在你的终端中可见。
</details>

<details>
<summary><strong>截图时窗口会闪一下？</strong></summary>

如果没有授予屏幕录制权限，截图时需要短暂激活 Safari 窗口（约 0.3 秒），之后会自动切回。授予屏幕录制权限后可以实现完全后台截图，不会有任何窗口切换。
</details>

<details>
<summary><strong>兼容哪些 AI Agent？</strong></summary>

任何支持 Claude Code Skills 的 AI Agent 都能用，包括 Claude Code、Cursor、Windsurf 等。
</details>

---

## License

[MIT](LICENSE)
