# DSH Sidebar Plugin Manager

[中文](README.md) | English

`dsh-plugin-sidebar-manager` is a standalone DSH Web plugin. It adds a Plugins button to the bottom of the sidebar, where you can browse the current Loader inventory, search by plugin, group entries by category, and manage runtime state.

## Preview

<p align="center">
  <img src="docs/plugin-manager-overview.png" alt="DSH Sidebar Plugin Manager" width="100%">
</p>

## Features

- Shows Plugins and the total plugin count when the sidebar is expanded. The collapsed sidebar uses the same icon as Settings > Plugins.
- Opens the plugin panel above the sidebar footer.
- Classifies `@deepseek-ai/*` and `cordis:*` modules as system plugins. All other modules appear under User-added plugins.
- Follows the DSH interface language with complete Simplified Chinese and English copy.
- Searches by full module name, short name, or Loader `entryId`, without case sensitivity.
- Lets you expand or collapse the system and user-added groups independently.
- Enables or disables user-added plugins at runtime, then reloads the actual state from the Host.
- Keeps DSH and Cordis system plugins read-only. The plugin manager cannot modify itself.
- Handles loading, empty inventory, no results, retryable load failures, and per-entry operation failures.
- Closes with Escape, an outside click, or a second click on the Plugins button.

## Quick Start

### Requirements

- DeepSeek Harness is installed and `dsh web` starts successfully.
- DSH `0.1.0-rc.7` is installed.
- Install this plugin into the `web` profile.

### Install from the repository checkout (recommended)

`packages/dsh-plugin-sidebar-manager` contains prebuilt code and can be installed as a local checkout, following the same pattern as the official DSH example:

```powershell
git clone https://github.com/rain02333z-spec/dsh-plugin-sidebar-manager.git
Set-Location dsh-plugin-sidebar-manager
pnpm --dir ./packages/dsh-plugin-sidebar-manager install --prod --no-lockfile --config.auto-install-peers=false
dsh plugin --profile web add ./packages/dsh-plugin-sidebar-manager
```

The `pnpm` command installs only the checkout's runtime dependency. The DSH host provides the peer dependencies. `dsh plugin add` then records the local directory as a `link:` dependency in the `web` profile.

When you run the CLI from a DSH source checkout, resolve the plugin directory first and pass its absolute path:

```powershell
$plugin = (Resolve-Path './packages/dsh-plugin-sidebar-manager').Path
$dshRepo = 'C:\path\to\deepseek-harness'
pnpm --dir $dshRepo dsh plugin --profile web add $plugin
```

Stop and restart `dsh web` after installation. Refreshing the browser alone will not load a newly installed plugin.

### Install from GitHub Release

If you do not need to keep a repository checkout, install the published tarball directly:

```powershell
dsh plugin --profile web add https://github.com/rain02333z-spec/dsh-plugin-sidebar-manager/releases/download/v0.1.1/dsh-plugin-sidebar-manager-0.1.1.tgz
```

### Build from source (development)

The source uses the DSH monorepo build conventions. Run these commands from the DSH repository root:

```powershell
git clone https://github.com/rain02333z-spec/dsh-plugin-sidebar-manager.git packages/extensions/plugin-manager
pnpm install
pnpm exec tsc -b packages/extensions/plugin-manager/tsconfig.host.json packages/extensions/plugin-manager/tsconfig.client.json
pnpm --filter dsh-plugin-sidebar-manager bundle

$plugin = (Resolve-Path 'packages/extensions/plugin-manager').Path
pnpm dsh plugin --profile web add $plugin
```

The profile links the source checkout. After changing the code, rebuild the types and bundle, then restart `dsh web`.

### Verify and uninstall

After restarting, the Plugins entry at the bottom of the sidebar confirms that the plugin loaded. You can also inspect the composed `web` profile configuration:

```powershell
dsh --profile web --dump-config
```

Uninstall the plugin with:

```powershell
dsh plugin --profile web remove dsh-plugin-sidebar-manager
```

Restart `dsh web` after uninstalling it.

## How It Works

The plugin has two parts:

- The Host mounts the `pluginManager.setEnabled` Remote and changes the current runtime state through Cordis Loader's `Entry.update({ disabled })`.
- The Client reuses DSH's built-in, read-only `pluginInventory.list()` Remote and registers with `sidebar.footer.action`.

Runtime changes do not modify the profile's `cordis.patch.yml`. After DSH restarts, plugin states return to the values defined by the profile configuration.

## Compatibility

The current source and package target DSH `0.1.0-rc.7`. They depend on the following surfaces from that release:

- `pluginInventory` Remote
- `sidebar.footer.action` list slot
- DSH Client Module Loader
- Typert Remote generation and loading

## Development and Verification

The source follows the DSH monorepo conventions for dual Host and Client plugins. Sync this directory to `packages/extensions/plugin-manager`, add its projects to the root `tsconfig.host.json` and `tsconfig.client.json`, then run:

```powershell
Set-Location <DSH monorepo root>
pnpm exec vitest run packages/extensions/plugin-manager/tests
pnpm exec tsc -b packages/extensions/plugin-manager/tsconfig.host.json packages/extensions/plugin-manager/tsconfig.client.json
pnpm --filter dsh-plugin-sidebar-manager bundle
pnpm --filter dsh-plugin-sidebar-manager pack
```

The panel changes visible Web behavior. Before merging the plugin into DSH, also run `pnpm run test:gui` and the Web replay tests.
