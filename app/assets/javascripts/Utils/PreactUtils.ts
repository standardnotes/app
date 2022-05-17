import { render } from 'preact'

/**
 * Source: https://stackoverflow.com/questions/50946950/how-to-destroy-root-preact-node
 * For some reason importing `import { unmountComponentAtNode } from 'preact/compat'` inside of app/index.tsx
 * results in the app failing to compile.
 */
export function unmountComponentAtRoot(root: HTMLElement) {
  render(null, root)
}
