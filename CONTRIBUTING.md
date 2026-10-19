# 开发指南

本文档介绍如何在本地搭建并开发 `vite-plugin-uni-platform-modifier`。

## 前置条件

- [Node.js](https://nodejs.org/) 26（见仓库根目录 `.node-version`）
- [pnpm](https://pnpm.io/) 12.14.0（见根 `package.json` 的 `packageManager` 字段）

## 常用命令

以下命令均在仓库根目录执行：

```bash
# 安装依赖
pnpm install

# 构建产物到 dist/（esm + cjs + d.ts）
pnpm build

# watch 模式构建（改 src 时使用）
pnpm dev

# 运行测试
pnpm test

# 测试覆盖率
pnpm coverage

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck
```

`playground` 是一个示例 uni-app 项目，`vite.config.ts` 直接 import `../src/index`，调试插件不需要先 `pnpm build`：

```bash
# 以 H5 / 微信小程序启动 playground
pnpm -C playground dev:h5
pnpm -C playground dev:mp-weixin

# 其它平台见 playground/package.json，如 dev:app、dev:mp-alipay
```

## 测试

测试文件位于根目录 `test/`，使用 [Vitest](https://vitest.dev/) 运行：

```shell
test/
├── utils.test.ts     src/utils.ts 各工具函数的单元测试
├── context.test.ts   transform 端到端测试：遍历 fixtures/*.vue 生成快照
├── fixtures/         模板样例（*.vue）
└── __snapshots__/    快照文件
```

两个测试文件都通过 `vi.mock` 固定 `@uni-helper/uni-env`（platform 固定为 mp-weixin），测试结果与真实 `UNI_PLATFORM` 无关。插件输出变化导致快照失败时，先确认新输出正确，再运行 `pnpm test -u` 更新快照。

## 项目结构

```shell
vite-plugin-uni-platform-modifier/
├── .github/workflows/  CI 与发布工作流
├── src/                插件源码（入口 index.ts，核心改写逻辑在 utils.ts）
├── test/               测试文件与 fixtures
├── playground/         示例 uni-app 项目
└── pnpm-workspace.yaml
```

## 提交规范

提交信息遵循[约定式提交](https://www.conventionalcommits.org/zh-hans/)规范（`feat:` / `fix:` / `docs:` / `test:` / `chore:` …），破坏性变更需在提交信息中标记（如 `feat!:` 或 `BREAKING CHANGE:`）。版本发布由 `bumpp` 驱动（`pnpm release`）。

## Pull Request 指南

- 一个 PR 解决一个问题，不要夹带无关改动。
- 提 PR 前在本地跑一遍 `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`。
- CI（`.github/workflows/ci.yml`）在 push / PR 到 `main` 及 merge group 时运行，矩阵为 ubuntu / macos / windows × Node 22 / 24 / 26。
- 改动插件行为、导出名或支持的修饰符时，同步更新 README。
- 新增插件选项、重构模块这类改动，先开 issue 讨论方案再动手。

## 发布

仅维护者操作：

1. `pnpm release` 调用 `bumpp`，更新根 `package.json` 的版本号，并提交、打 `v*` tag、推送。
2. tag 推送后 `.github/workflows/release.yml` 触发：用 changelogithub 生成 GitHub Release，再 `pnpm publish --access public` 发布到 npm（`prepublishOnly` 会先自动执行 `pnpm build`）。发布通过 npm trusted publishing（OIDC）鉴权：需要先在 npmjs.com 的包设置里把本仓库的 release 工作流登记为可信发布者，未配置时 publish 会因缺少权限失败。

## 行为准则

本项目遵循 [uni-helper 行为准则](https://github.com/uni-helper/.github/blob/main/CODE_OF_CONDUCT.md)。

有问题或建议请到 [GitHub Issues](https://github.com/uni-helper/vite-plugin-uni-platform-modifier/issues) 反馈。
