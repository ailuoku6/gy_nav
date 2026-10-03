# GY Nav

This project is a React + TypeScript + Vite application with a Hono API.

## Cloudflare development

The primary development and deployment path now uses the Cloudflare CLI (`cf`):

```sh
pnpm install
pnpm dev
pnpm build
pnpm deploy
```

See [docs/cloudflare-cli-migration.md](docs/cloudflare-cli-migration.md) for the
Worker configuration, D1 environments, required secrets, and the Pages rollback
path.

The original `wrangler.toml` and `build:pages` command are intentionally kept
for rollback and compatibility testing. They are not merged into the new
`cloudflare.config.ts` configuration.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
