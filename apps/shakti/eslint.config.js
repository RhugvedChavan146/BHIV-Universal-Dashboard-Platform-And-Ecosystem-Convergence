// Thin re-export so `eslint .` works when invoked with this app's directory
// as the working directory (e.g. via `npm run lint --workspace=shakti-command-center`).
// The actual rules live in the shared root config.
export { default } from "../../eslint.config.js";
