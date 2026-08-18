# Installable checkout package

`dsh-plugin-sidebar-manager/` contains the prebuilt package used by:

```powershell
dsh plugin --profile web add ./packages/dsh-plugin-sidebar-manager
```

The directory mirrors the runtime files in the matching release tarball. Do not edit generated files under `lib/` by hand. When the source version changes, rebuild and pack the root project, then refresh this directory from that tarball before committing.

A plain directory install becomes a pnpm `link:` dependency. Run the production dependency installation documented in the root README first so the linked checkout can resolve `zod`; DSH peer dependencies continue to come from the host installation.
