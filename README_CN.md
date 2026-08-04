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
4. **（可选）系统设置 > 隐私与安全性 > 屏幕录制** → 允许终端或 Agent 宿主（启用可靠的后台截图）
5. **（可选）系统设置 > 隐私与安全性 > 辅助功能** → 仅在使用 System Events 点击或键盘输入时需要

---

## 它能做什么

无需浏览器扩展、代理或常驻后台服务。核心能力使用 macOS 原生工具；可选窗口 helper 需要系统中可用的 Swift 工具链。

| 能力 | Agent 做的事 | 实现方式 |
|------|------------|---------|
| **查看标签页** | 列出所有窗口和标签的标题、URL | AppleScript |
| **读取页面** | 提取页面文本、结构化数据、简化 DOM | AppleScript + JavaScript |
| **执行 JS** | 在页面上下文中运行任意 JavaScript | AppleScript `do JavaScript` |
| **截图** | 截取 Safari 窗口画面，AI 可以"看到"页面 | `screencapture` |
| **导航** | 打开 URL、新建标签页、新建窗口 | AppleScript |
| **点击** | 点击页面元素（兼容 React/Vue/Angular） | JavaScript `dispatchEvent` |
| **输入** | 填写表单、模拟键盘输入 | JavaScript + System Events |
| **安全表单填写** | 发现字段并填写受支持的非敏感控件，逐字段回读验证 | 内置 JavaScript + JXA |
| **网络观察** | 观察经脱敏的页面级 fetch/XHR 元数据；正文必须显式启用 | 内置 JavaScript |
| **控制指示器** | 在 Agent 修改页面时显示状态，结束后清理 | 内置 JavaScript |
| **滚动** | 上下滚动、滚动到指定元素 | JavaScript `scrollBy/scrollTo` |
| **切换标签** | 按序号或 URL 关键词切换标签页 | AppleScript |
| **等待加载** | 等待页面加载完成后再操作 | JavaScript `readyState` |

### 截图模式

| 模式 | 需要权限 | 是否切换窗口 | 适用场景 |
|------|---------|------------|---------|
| **后台截图** | 屏幕录制权限 | 不切换 | 推荐，无感截图 |
| **可见截图** | 视 macOS 权限策略而定 | 会切换 | 后台截图不可用时的兜底 |

---

## 工作原理

```
Claude Code ──osascript──► Safari（读取/操控你的真实浏览器）
     │
     └──screencapture──► 截图 ──► Claude 看到页面内容
```

没有扩展、代理服务器或常驻后台服务。

Skill 使用 AppleScript、页面 JavaScript、`screencapture` 和可选内置 helper。网站可能检测到注入页面的 helper，任务结束后会执行清理。

---

## 常见问题

<details>
<summary><strong>需要提前安装什么吗？</strong></summary>

核心能力无需浏览器扩展或独立自动化浏览器，使用 macOS 的 AppleScript 和 `screencapture`。编译可选的多窗口 helper 需要 `swiftc` / Apple Command Line Tools。
</details>

<details>
<summary><strong>支持 Chrome / Firefox / Arc 吗？</strong></summary>

目前仅支持 Safari。其他浏览器推荐使用 <a href="https://github.com/nicepkg/playwright-mcp">Playwright MCP</a> 或 <a href="https://github.com/Areo-Joe/chrome-acp">Chrome ACP</a>。Safari 是 macOS 上唯一完整支持 AppleScript 自动化的浏览器。
</details>

<details>
<summary><strong>安全吗？AI 会不会乱操作？</strong></summary>

Skill 会验证操作目标、保留网站确认弹窗、排除敏感表单字段，并在有外部影响的操作前请求授权；同时仍受 Agent 宿主自身权限策略约束。
</details>

<details>
<summary><strong>截图时窗口会闪一下？</strong></summary>

授予终端或 Agent 宿主屏幕录制权限后，可以可靠地进行后台窗口截图。未授权时应使用用户可见的截图流程并检查结果，不能假设截图已经成功。
</details>

<details>
<summary><strong>兼容哪些 AI Agent？</strong></summary>

任何支持 Claude Code Skills 的 AI Agent 都能用，包括 Claude Code、Cursor、Windsurf 等。
</details>

---

## 致谢

- [@rrecio](https://github.com/rrecio) 在 [PR #2](https://github.com/SDLLL/claude-for-safari/pull/2) 中贡献了表单、控制指示器、窗口 helper、网络观察和真实 Safari 测试思路。
- [@jordan-brough](https://github.com/jordan-brough) 在 [PR #3](https://github.com/SDLLL/claude-for-safari/pull/3) 中贡献了权限、弹窗、本地化、时间戳和 Safari UI 测量经验。

这些贡献形成了本次由维护者整合并强化安全边界的版本基础。

---

## License

[MIT](LICENSE)
