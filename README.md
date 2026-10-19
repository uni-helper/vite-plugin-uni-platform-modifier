# vite-plugin-uni-platform-modifier

<p align="center">
  <img src="./logo.svg" alt="logo" width="256" height="256"/>
</p>

<p align="center">
  <a href="https://github.com/uni-helper/vite-plugin-uni-platform-modifier/blob/main/LICENSE"><img src="https://img.shields.io/github/license/uni-helper/vite-plugin-uni-platform-modifier?style=for-the-badge&labelColor=005947&color=eee" alt="License"></a>
  <a href="https://github.com/uni-helper/vite-plugin-uni-platform-modifier/stargazers"><img src="https://img.shields.io/github/stars/uni-helper/vite-plugin-uni-platform-modifier?style=for-the-badge&labelColor=005947&color=eee" alt="Stars"></a>
  <a href="https://npmx.dev/package/@uni-helper/vite-plugin-uni-platform-modifier"><img src="https://img.shields.io/npm/v/@uni-helper/vite-plugin-uni-platform-modifier?style=for-the-badge&labelColor=005947&color=eee" alt="NPM Version"></a>
  <a href="https://npmx.dev/package/@uni-helper/vite-plugin-uni-platform-modifier"><img src="https://img.shields.io/npm/dm/@uni-helper/vite-plugin-uni-platform-modifier?style=for-the-badge&labelColor=005947&color=eee" alt="NPM Downloads"></a>
</p>

<p align="center">
  <a href="https://github.com/kejunmao"><img src="https://img.shields.io/badge/Author-KeJun-blue?style=for-the-badge" alt="Author"></a>
  <a href="https://github.com/ModyQyW"><img src="https://img.shields.io/badge/Maintainer-ModyQyW-blue?style=for-the-badge" alt="Maintainer"></a>
</p>

为属性、指令提供平台修饰符并按需编译。

不想看文档？直接问 AI 🤖 <a href="https://deepwiki.com/uni-helper/vite-plugin-uni-platform-modifier"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>

## 简介

为 uni-app 项目的模板属性与指令提供平台修饰符：同一个属性可以按平台写多份取值（`class.h5`、`@click.mp-weixin`、`v-text.app`……），插件在编译期按当前平台（`process.env.UNI_PLATFORM`）为每组属性保留匹配的那份，没有平台匹配时保留默认值。只处理 `.vue` 和 `.nuvue` 文件，基于 `@vue/compiler-dom` 的模板 AST 定位属性，用 `magic-string` 改写源码并生成 sourcemap。

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-platform-modifier
```

插件 peer 依赖 `vite ^5.0.0`。

## 使用

### 配置

```ts
import Uni from '@dcloudio/vite-plugin-uni'
import UniPlatformModifier from '@uni-helper/vite-plugin-uni-platform-modifier'
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [Uni(), UniPlatformModifier()],
})
```

也提供命名导出，两种引入方式等价：

```ts
import { VitePluginUniPlatformModifier } from '@uni-helper/vite-plugin-uni-platform-modifier'
```

> 自 0.2.0 起，插件工厂函数更名为 `VitePluginUniPlatformModifier`（旧名 `VitePluginUniPlatformVOnModifier` 系笔误，已移除）。

### 编写代码

```html
<button
  v-text="'hello'"
  v-text.h5.mp-weixin="'h5&mp-weixin'"
  class.h5="h5-class"
  class="default-class"
  @click.h5="handleH5Click"
  @click="handleDefaultClick"
/>
```

### 编译结果

<details>

<summary>编译到 H5</summary>

```html
<button
  v-text="'h5&mp-weixin'"
  class="h5-class"
  @click="handleH5Click"
/>
```
</details>
<details>

<summary>编译到微信小程序</summary>

```html
<button
  v-text="'h5&mp-weixin'"
  class="default-class"
  @click="handleDefaultClick"
/>
```
</details>
<details>

<summary>编译到其他平台</summary>

```html
<button
  v-text="'hello'"
  class="default-class"
  @click="handleDefaultClick"
/>
```
</details>

### 支持的修饰符

可用的修饰符集合来自 [`@uni-helper/uni-env`](https://github.com/uni-helper/uni-env) 导出的 `builtInPlatforms`，以实际安装的版本为准：

```js
[
  'app',
  'app-android',
  'app-harmony',
  'app-ios',
  'app-plus',
  'h5',
  'mp-360',
  'mp-alipay',
  'mp-baidu',
  'mp-harmony',
  'mp-jd',
  'mp-kuaishou',
  'mp-lark',
  'mp-qq',
  'mp-toutiao',
  'mp-weixin',
  'mp-xhs',
  'quickapp-webview',
  'quickapp-webview-huawei',
  'quickapp-webview-union',
  'web',
]
```

匹配依据是当前构建的平台标识：`UNI_PLATFORM`；App 端还会参考 `UNI_APP_PLATFORM`/`UNI_UTS_PLATFORM`，快应用参考 `UNI_SUB_PLATFORM`。`h5` 与 `web` 视为同一个浏览器目标，写任意一个都会生效；其余平台名按值精确匹配。同一属性命中多个当前平台修饰符时，使用第一个并在构建时输出警告。

## 参与贡献

欢迎提交 [Issue](https://github.com/uni-helper/vite-plugin-uni-platform-modifier/issues) 与 Pull Request，开发流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

[MIT](https://github.com/uni-helper/vite-plugin-uni-platform-modifier/blob/main/LICENSE)
