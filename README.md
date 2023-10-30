# vite-plugin-uni-platform-modifier

为属性、指令提供平台修饰符并按需编译


## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-platform-modifier
```

## 使用

### 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
import UniPlatformModifier from '@uni-helper/vite-plugin-uni-platform-modifier'

export default defineConfig({
  plugins: [Uni(), UniPlatformModifier()],
})
```

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

<details>

<summary>编译到H5</summary>

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


```js
['app', 'app-plus', 'h5', 'mp-360', 'mp-alipay', 'mp-baidu', 'mp-jd', 'mp-kuaishou', 'mp-lark', 'mp-qq', 'mp-toutiao', 'mp-weixin', 'quickapp-webview', 'quickapp-webview-huawei', 'quickapp-webview-union']
```
