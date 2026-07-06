# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Testing

Unit and component tests use [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (jsdom environment).

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
npm run test:coverage  # run with coverage report (text + HTML in ./coverage)
```

Test files live next to the code as `*.test.js` / `*.test.jsx`, or under `src/test/`. Global setup (jest-dom matchers, auto cleanup) is in `src/test/setup.js`. Per the EDD (kap. 11), coverage focus is the data layer (`src/db/*`) and `src/lib/*`; UI has no hard coverage threshold.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
