# DSH 侧栏插件管理器

中文 | [English](README.en.md)

## 是什么

`dsh-plugin-sidebar-manager` 为 DSH Web UI 左侧栏添加“插件”按钮，将系统自带插件和用户新增插件分类展示，简化插件管理和搜索操作。

## 界面预览

<p align="center">
  <img src="docs/plugin-manager-overview.png" alt="DSH 侧栏插件管理器" width="100%">
</p>

## 功能

- 左侧栏展开时显示“插件”和插件总数，收起时显示与“设置 → 插件”一致的图标按钮。
- 点击按钮后，在侧栏上方打开插件面板。
- `@deepseek-ai/*` 与 `cordis:*` 归为“系统插件”，其他模块归为“用户新增”。
- 界面跟随 DSH 全局语言，完整支持简体中文和英文。
- 按完整模块名、短名称或 Loader `entryId` 搜索，不区分大小写。
- 系统与用户插件分组可独立展开或收起。
- 用户新增插件支持运行时启用和停用，操作后重新读取 Host 真实状态。
- DSH 与 Cordis 系统插件保持只读，插件管理器自身也不可修改。
- 提供加载中、空列表、搜索无结果、加载失败重试和单项操作失败状态。
- 支持 Escape、点击面板外部和再次点击入口关闭面板。

## 快速开始

需要 DSH `0.1.0-rc.7` 和 pnpm。按顺序执行：

```powershell
# 1. 克隆仓库
git clone https://github.com/rain02333z-spec/dsh-plugin-sidebar-manager.git
cd dsh-plugin-sidebar-manager

# 2. 准备本地安装包
node scripts/prepare-checkout.mjs

# 3. 安装到 web profile
dsh plugin --profile web add ./packages/dsh-plugin-sidebar-manager

# 4. 重启 DSH Web
dsh web
```

重启后，左侧栏底部出现“插件”入口即表示安装成功。

卸载插件：

```powershell
dsh plugin --profile web remove dsh-plugin-sidebar-manager
```

## 运行机制

插件包含两部分：

- Host 端挂载 `pluginManager.setEnabled` Remote，通过 Cordis Loader 的 `Entry.update({ disabled })` 修改当前运行状态。
- Client 端复用 DSH 内置只读 `pluginInventory.list()` Remote，并注册到 `sidebar.footer.action`。

启停只修改当前 Loader 运行状态，不写回 profile 的 `cordis.patch.yml`。重启 DSH 后，插件状态按照原 profile 配置恢复。

## 兼容性

当前源码和安装包面向 DSH `0.1.0-rc.7`。它依赖该版本提供的：

- `pluginInventory` Remote
- `sidebar.footer.action` 列表 slot
- DSH Client Module Loader
- Typert Remote 生成与加载机制

## 开发与验证

源码使用 DSH monorepo 的双端插件构建约定。将本目录同步到 `packages/extensions/plugin-manager`，并确保根 `tsconfig.host.json`、`tsconfig.client.json` 引用对应项目后运行：

```powershell
Set-Location <DSH monorepo root>
pnpm exec vitest run packages/extensions/plugin-manager/tests
pnpm exec tsc -b packages/extensions/plugin-manager/tsconfig.host.json packages/extensions/plugin-manager/tsconfig.client.json
pnpm --filter dsh-plugin-sidebar-manager bundle
pnpm --filter dsh-plugin-sidebar-manager pack
```

面板属于可见 Web 行为；合入 DSH 仓库前还应运行 `pnpm run test:gui` 和 Web replay 测试。
