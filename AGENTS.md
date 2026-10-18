# vite-plugin-uni-platform-modifier

为 uni-app 模板的属性与指令提供平台修饰符的 Vite 插件：同一个属性按平台写多份（`class.h5`、`@click.mp-weixin`），编译期按 `UNI_PLATFORM` 为每组属性保留对应取值。

## 项目

- **语言/模块**：TypeScript，`strict`（`tsconfig.json`）；根 `package.json` 就是发布包（`"type": "module"`），tsdown 构建到 `dist/`（esm + cjs + d.ts）。
- **Node**：24（`.node-version`）。
- **包管理器**：pnpm 10.33.4（根 `package.json` 的 `packageManager`）。依赖版本集中在 `pnpm-workspace.yaml` 的 `catalog:`，`package.json` 里一律写 `"catalog:"`，升依赖只改 catalog。
- **测试**：vitest（`vitest.config.ts` 只配了 istanbul coverage），测试在根 `test/`，直接 import `src/`，不依赖 `dist`。
- **Lint**：`@uni-helper/eslint-config`（flat config）；`.vscode/settings.json` 已提交（关 prettier，eslint 自动修复，风格规则静默）。
- **workspace**：只有 `playground`（示例 uni-app 应用，manifest 里的 name 是 `vitesse-uni-app`，从模板复制来的），`vite.config.ts` 直接 import `../src/index`，不经过 `dist`。
- **peer 依赖**：`vite ^5.0.0`。
- **平台来源**：可接受的修饰符 = `@uni-helper/uni-env` 导出的 `builtInPlatforms`（当前 19 个），当前平台 = 同包导出的 `platform`（即 `process.env.UNI_PLATFORM`）；插件里没有硬编码平台列表。

## 命令

```bash
# 安装
pnpm install

# 构建到 dist/（esm + cjs + d.ts）
pnpm build

# watch 构建
pnpm dev

# 检查
pnpm test                       # vitest watch
pnpm coverage                   # vitest run --coverage（istanbul）
pnpm lint
pnpm lint:fix

# playground（直接吃 src/，无需先 build）
pnpm -C playground dev:h5
pnpm -C playground dev:mp-weixin
pnpm -C playground run dev:app  # 其它平台见 playground/package.json
pnpm -C playground typecheck    # vue-tsc，只检查 playground

# 发布（维护者）
pnpm release                    # bumpp：改版本、提交、打 v* tag 并推送
```

## 架构

| 路径 | 职责 |
| --- | --- |
| `src/index.ts` | Vite 插件入口：`enforce: 'pre'`，`transform` 钩子里交给 `Context` |
| `src/context.ts` | `Context`：`createFilter('**/*.?(nu)vue')` 只放行 `.vue` / `.nuvue`；`parse` → 取根 `template` → `transformProps` → 有变更才返回 `{ code, map }` |
| `src/utils.ts` | 核心改写逻辑（见下） |
| `src/constants.ts` | `pluginName` |
| `test/` | 单元测试 + fixture 驱动的快照测试（mock 掉 `@uni-helper/uni-env` 固定平台） |
| `playground/` | 示例 uni-app 应用 |

`transformProps` 的选择规则（`src/utils.ts`）：属性名连同平台修饰符归一化后**按属性名分组**；每组先整组从源码移除，再选出"修饰符含当前平台"的第一条（命中多条则输出警告并取第一条，`computedPropSource` 负责剥掉平台修饰符），把最终值 `overwrite` 回"无修饰符默认属性"的位置——没有默认属性时写回平台属性的位置。输出里属性的位置由保留下来的那条决定。

## 约定

- **提交信息**：Conventional Commits（`feat:` / `fix:` / `docs:` / `test:` / `chore:` …），破坏性变更加 `!` 或 `BREAKING CHANGE:`。
- **测试方式**：测模板改写行为时在 `test/fixtures/` 加 `.vue` 样例，`context.test.ts` 会自动遍历并出快照；快照失败先人工确认新输出，再 `pnpm test -u`。
- **CI**：push / PR 到 `main` 时跑 `build` → `type-check`，矩阵 ubuntu / macos / windows × Node 22 / 24 / 26。注意：根 `package.json` 目前没有 `type-check` 脚本，该步骤会失败（待修复）；本地等价检查用 `pnpm lint`、`pnpm test`。
- **发布**：`pnpm release`（bumpp）→ tag 触发 `release.yml`：changelogithub 建 GitHub Release + `pnpm publish --access public`（`prepublishOnly` 先 build）。
- **文档同步**：改脚本、插件行为或导出名时，同步更新 README、CONTRIBUTING 和本文件。
