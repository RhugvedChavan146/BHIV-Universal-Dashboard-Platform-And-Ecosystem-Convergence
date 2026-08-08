# Dependency Audit

Static check (grep across `apps/` and `packages/` source, excluding
`node_modules` and lockfiles) run as part of the repository hardening pass.

## Removed — unused, unwired devDependencies

`apps/shakti/package.json` listed four packages with no reference anywhere
in the source tree or in `vite.config.ts` (no Babel config file, no
`babel: {...}` option passed to `@vitejs/plugin-react`):

- `@babel/core`
- `@rolldown/plugin-babel`
- `@types/babel__core`
- `babel-plugin-react-compiler`

These look like an abandoned attempt to wire up the React Compiler Babel
plugin — `@vitejs/plugin-react` never received a `babel` option pointing at
it, so they were pure dead weight (slower `npm ci`, larger `node_modules`,
no effect on the build). Removed from `devDependencies`.

**If React Compiler integration is still wanted**, re-add
`babel-plugin-react-compiler` and pass it to `@vitejs/plugin-react` in
`apps/shakti/vite.config.ts`:

```ts
react({ babel: { plugins: [["babel-plugin-react-compiler", {}]] } })
```

## Left as-is — flagged for a judgment call, not removed

- **`react-router-dom`** (`apps/shakti/package.json`, `dependencies`) — only
  referenced from `src/test/layouts.test.tsx` (likely a `MemoryRouter` test
  wrapper), not from any app code; `App.tsx` renders `<Dashboard />`
  directly with no router. It may be intentional prep for future routing.
  Left in `dependencies` rather than moved to `devDependencies` or removed,
  since that's a product decision, not a cleanup one.

## After pulling this change

Regenerate the lockfile so `package-lock.json` matches the trimmed
`package.json`:

```bash
npm install
```
