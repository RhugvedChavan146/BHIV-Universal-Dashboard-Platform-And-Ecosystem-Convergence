// Minimal ambient typing for `import.meta.env`, mirroring the subset of
// `vite/client` this package relies on (see logger.ts). Declared locally so
// this package has no hard dependency on Vite and stays usable in any
// consuming app's bundler.
declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
